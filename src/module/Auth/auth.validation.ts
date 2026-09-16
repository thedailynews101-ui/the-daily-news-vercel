import { z } from "zod";

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Invalid email address");

const password = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const resendVerificationSchema = z.object({
  email,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ error: "Current password is required" }).min(1),
  newPassword: password,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
