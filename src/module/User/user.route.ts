import { Router } from "express";

import * as userController from "./user.controller";
import { updateUserRoleSchema } from "./user.validation";
import { UserRole } from "../../generated/prisma/enums";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";

const router = Router();

const ADMINS = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

router.get("/", auth(...ADMINS), userController.listUsers);
router.patch(
  "/:id/role",
  auth(...ADMINS),
  validateRequest(updateUserRoleSchema),
  userController.updateUserRole
);

export default router;
