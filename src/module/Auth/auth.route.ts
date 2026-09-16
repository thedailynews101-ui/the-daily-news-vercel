import { Router } from "express";

import * as authController from "./auth.controller";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from "./auth.validation";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";

const router = Router();

router.post("/signup", validateRequest(signupSchema), authController.signup);
router.post("/verify-email", validateRequest(verifyEmailSchema), authController.verifyEmail);
router.post(
  "/resend-verification",
  validateRequest(resendVerificationSchema),
  authController.resendVerification
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

router.get("/me", auth(), authController.getMe);
router.post(
  "/change-password",
  auth(),
  validateRequest(changePasswordSchema),
  authController.changePassword
);

export default router;
