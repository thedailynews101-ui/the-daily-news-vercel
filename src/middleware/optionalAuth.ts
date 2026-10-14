import { NextFunction, Request, Response } from "express";

import prisma from "../lib/prisma";
import { ACCESS_TOKEN_COOKIE } from "../utils/cookies";
import { verifyAccessToken } from "../utils/jwt";

/**
 * Attaches `req.user` when a valid access token is present.
 * Never rejects — unauthenticated requests continue without a user.
 */
const optionalAuth = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const bearerToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined;

      const token = req.cookies?.[ACCESS_TOKEN_COOKIE] ?? bearerToken;
      if (!token) {
        next();
        return;
      }

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, status: true, deletedAt: true },
      });

      if (user && !user.deletedAt && user.status === "ACTIVE") {
        req.user = { id: user.id, role: user.role };
      }

      next();
    } catch {
      next();
    }
  };
};

export default optionalAuth;
