/**
 * Machine-readable auth error codes. Keep this in sync with the identical
 * string literals used on the frontend (dailynews-client/src/types/auth.ts)
 * so the client can branch on `errorCode` instead of matching `message` text.
 */
export const AuthErrorCode = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  ACCOUNT_RESTRICTED: "ACCOUNT_RESTRICTED",
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];
