import { Request, Response } from "express";

import { RequestMeta } from "./auth.service";
import * as authService from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import { clearAuthCookies, REFRESH_TOKEN_COOKIE, setAuthCookies } from "../../utils/cookies";

const getRequestMeta = (req: Request): RequestMeta => ({
  userAgent: req.headers["user-agent"],
  ipAddress: req.ip,
});

const getRefreshTokenFromRequest = (req: Request): string | undefined => {
  return req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken;
};

export const signup = async (req: Request, res: Response) => {
  const user = await authService.signup(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Account created. Please check your email to verify your account.",
    data: user,
  });
};

export const verifyEmail = async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);

  sendResponse(res, {
    statusCode: 200,
    message: "Email verified successfully. You can now log in.",
  });
};

export const resendVerification = async (req: Request, res: Response) => {
  await authService.resendVerification(req.body);

  sendResponse(res, {
    statusCode: 200,
    message: "If an account with that email exists, a new verification link has been sent.",
  });
};

export const login = async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(
    req.body,
    getRequestMeta(req)
  );

  setAuthCookies(res, { accessToken, refreshToken });

  sendResponse(res, {
    statusCode: 200,
    message: "Logged in successfully.",
    data: { user, accessToken },
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const presentedRefreshToken = getRefreshTokenFromRequest(req);

  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshTokens(
    presentedRefreshToken,
    getRequestMeta(req)
  );

  setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });

  sendResponse(res, {
    statusCode: 200,
    message: "Access token refreshed.",
    data: { accessToken },
  });
};

export const logout = async (req: Request, res: Response) => {
  await authService.logout(getRefreshTokenFromRequest(req));

  clearAuthCookies(res);

  sendResponse(res, {
    statusCode: 200,
    message: "Logged out successfully.",
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: 200,
    message: "If an account with that email exists, a password reset link has been sent.",
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);

  clearAuthCookies(res);

  sendResponse(res, {
    statusCode: 200,
    message: "Password reset successfully. Please log in with your new password.",
  });
};

export const changePassword = async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.id, req.body, getRefreshTokenFromRequest(req));

  sendResponse(res, {
    statusCode: 200,
    message: "Password changed successfully.",
  });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);

  sendResponse(res, {
    statusCode: 200,
    message: "User retrieved successfully.",
    data: user,
  });
};
