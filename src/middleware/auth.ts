import { NextFunction, Request, Response } from "express";

import prisma from "../lib/prisma";
import AppError from "../utils/AppError";
import { ACCESS_TOKEN_COOKIE } from "../utils/cookies";
import { verifyAccessToken } from "../utils/jwt";
import { UserRole } from "../generated/prisma/enums";

/**
 * Protects a route. Call with no arguments to require any authenticated,
 * active user, or pass allowed roles to further restrict access, e.g.
 * `auth(UserRole.ADMIN, UserRole.SUPER_ADMIN)`.
 */
const auth = (...allowedRoles: UserRole[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const bearerToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined;

      const token = req.cookies?.[ACCESS_TOKEN_COOKIE] ?? bearerToken;

      if (!token) {
        throw new AppError(401, "You are not logged in. Please log in to continue.");
      }

      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, status: true, deletedAt: true },
      });

      if (!user || user.deletedAt) {
        throw new AppError(401, "This account no longer exists.");
      }

      if (user.status !== "ACTIVE") {
        throw new AppError(403, "Your account is not active.");
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        throw new AppError(403, "You do not have permission to perform this action.");
      }

      req.user = { id: user.id, role: user.role };
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
