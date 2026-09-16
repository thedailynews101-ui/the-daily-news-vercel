import bcrypt from "bcryptjs";

import config from "../../config";
import { TokenType, UserRole, UserStatus } from "../../generated/prisma/enums";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../lib/mailer";
import prisma from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { parseDurationToMs } from "../../utils/duration";
import { AuthErrorCode } from "../../utils/errorCodes";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { createRawToken, hashToken } from "../../utils/token";
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResendVerificationInput,
  ResetPasswordInput,
  SignupInput,
} from "./auth.validation";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h

export type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  bio: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

const toPublicUser = (user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  bio: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  emailVerifiedAt: user.emailVerifiedAt,
  createdAt: user.createdAt,
});

/** Creates a verification/reset token row and returns the raw (unhashed) value. */
const issueToken = async (userId: string, type: TokenType, ttlMs: number): Promise<string> => {
  // Invalidate any previous unused tokens of this type so only the latest link works.
  await prisma.verificationToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawToken = createRawToken();

  await prisma.verificationToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });

  return rawToken;
};

const consumeToken = async (rawToken: string, type: TokenType) => {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError(400, "This link is invalid or has expired.");
  }

  return record;
};

const issueSession = async (
  userId: string,
  role: UserRole,
  meta: RequestMeta
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = signAccessToken({ sub: userId, role });
  const { token: refreshToken } = signRefreshToken({ sub: userId, role });

  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + parseDurationToMs(config.jwt.refreshExpiresIn)),
    },
  });

  return { accessToken, refreshToken };
};

export const signup = async (input: SignupInput): Promise<PublicUser> => {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, config.bcryptSaltRounds);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      status: UserStatus.PENDING_VERIFICATION,
    },
  });

  const rawToken = await issueToken(
    user.id,
    TokenType.EMAIL_VERIFICATION,
    EMAIL_VERIFICATION_TTL_MS
  );

  await sendVerificationEmail(user.email, rawToken);

  return toPublicUser(user);
};

export const verifyEmail = async (rawToken: string): Promise<void> => {
  const record = await consumeToken(rawToken, TokenType.EMAIL_VERIFICATION);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date(), status: UserStatus.ACTIVE },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
};

export const resendVerification = async (input: ResendVerificationInput): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always behave the same whether or not the account exists, to avoid leaking
  // which emails are registered.
  if (!user || user.deletedAt || user.status !== UserStatus.PENDING_VERIFICATION) {
    return;
  }

  const rawToken = await issueToken(
    user.id,
    TokenType.EMAIL_VERIFICATION,
    EMAIL_VERIFICATION_TTL_MS
  );

  await sendVerificationEmail(user.email, rawToken);
};

export const login = async (
  input: LoginInput,
  meta: RequestMeta
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> => {
  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password.", AuthErrorCode.INVALID_CREDENTIALS);
  }

  if (user.status === UserStatus.PENDING_VERIFICATION) {
    throw new AppError(
      403,
      "Please verify your email before logging in.",
      AuthErrorCode.EMAIL_NOT_VERIFIED
    );
  }

  if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED) {
    throw new AppError(
      403,
      "Your account has been restricted. Please contact support.",
      AuthErrorCode.ACCOUNT_RESTRICTED
    );
  }

  const { accessToken, refreshToken } = await issueSession(user.id, user.role, meta);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { user: toPublicUser(user), accessToken, refreshToken };
};

export const refreshTokens = async (
  presentedRefreshToken: string | undefined,
  meta: RequestMeta
): Promise<{ accessToken: string; refreshToken: string }> => {
  if (!presentedRefreshToken) {
    throw new AppError(401, "Missing refresh token.");
  }

  // Signature/expiry check first; a forged token never touches the database.
  const payload = verifyRefreshToken(presentedRefreshToken);
  const tokenHash = hashToken(presentedRefreshToken);

  const session = await prisma.session.findUnique({ where: { refreshTokenHash: tokenHash } });

  if (!session || session.userId !== payload.sub) {
    // Token was never issued for this user, or the database was reset - reject.
    throw new AppError(401, "Invalid refresh token. Please log in again.");
  }

  if (session.revokedAt || session.expiresAt < new Date()) {
    // The presented token was already rotated/used before: treat as a replay
    // and kill every session belonging to this user as a precaution.
    await prisma.session.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError(401, "Session expired or already used. Please log in again.");
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new AppError(401, "This account is no longer active.");
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const { token: newRefreshToken } = signRefreshToken({ sub: user.id, role: user.role });

  await prisma.$transaction([
    prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    }),
    prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(newRefreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + parseDurationToMs(config.jwt.refreshExpiresIn)),
      },
    }),
  ]);

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (presentedRefreshToken: string | undefined): Promise<void> => {
  if (!presentedRefreshToken) {
    return;
  }

  const tokenHash = hashToken(presentedRefreshToken);

  await prisma.session.updateMany({
    where: { refreshTokenHash: tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const forgotPassword = async (input: ForgotPasswordInput): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || user.deletedAt || user.status === UserStatus.BANNED) {
    return;
  }

  const rawToken = await issueToken(user.id, TokenType.PASSWORD_RESET, PASSWORD_RESET_TTL_MS);

  await sendPasswordResetEmail(user.email, rawToken);
};

export const resetPassword = async (input: ResetPasswordInput): Promise<void> => {
  const record = await consumeToken(input.token, TokenType.PASSWORD_RESET);

  const passwordHash = await bcrypt.hash(input.password, config.bcryptSaltRounds);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Password changed - any stolen refresh tokens should stop working.
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
};

export const changePassword = async (
  userId: string,
  input: ChangePasswordInput,
  currentRefreshToken: string | undefined
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    throw new AppError(400, "Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, config.bcryptSaltRounds);
  const currentSessionHash = currentRefreshToken ? hashToken(currentRefreshToken) : undefined;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    // Revoke every other session; the caller's current session (if any) stays alive.
    prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentSessionHash ? { refreshTokenHash: { not: currentSessionHash } } : {}),
      },
      data: { revokedAt: new Date() },
    }),
  ]);
};

export const getMe = async (userId: string): Promise<PublicUser> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.deletedAt) {
    throw new AppError(404, "User not found.");
  }

  return toPublicUser(user);
};
