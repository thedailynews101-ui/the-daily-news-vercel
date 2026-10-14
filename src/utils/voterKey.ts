import { randomUUID } from "crypto";
import { Request, Response } from "express";

import config from "../config";

export const VOTER_KEY_COOKIE = "voterKey";

const voterCookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: (config.isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
  maxAge: 365 * 24 * 60 * 60 * 1000,
};

/** Returns existing voter key cookie or creates and sets a new one. */
export const ensureVoterKey = (req: Request, res: Response): string => {
  const existing = req.cookies?.[VOTER_KEY_COOKIE];
  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }

  const voterKey = randomUUID();
  res.cookie(VOTER_KEY_COOKIE, voterKey, voterCookieOptions);
  return voterKey;
};
