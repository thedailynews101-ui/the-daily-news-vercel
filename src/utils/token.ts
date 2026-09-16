import crypto from "crypto";

/**
 * Generates a cryptographically random raw token. The raw value is only ever
 * sent to the user (e.g. in an email link) - the database stores its hash.
 */
export const createRawToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Deterministic one-way hash used to look up raw tokens (email-verification,
 * password-reset, refresh tokens) by their hash without storing the raw value.
 */
export const hashToken = (rawToken: string): string => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};
