import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";

import config from "../config";
import { UserRole } from "../generated/prisma/enums";

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

export type RefreshTokenPayload = {
  sub: string;
  role: UserRole;
  jti: string;
};

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as SignOptions);
};

export const signRefreshToken = (
  payload: Omit<RefreshTokenPayload, "jti">
): { token: string; jti: string } => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);

  return { token, jti };
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
};
