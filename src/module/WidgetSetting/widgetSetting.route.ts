import { Router } from "express";

import * as widgetSettingController from "./widgetSetting.controller";
import { updateWidgetSettingSchema } from "./widgetSetting.validation";
import { UserRole } from "../../generated/prisma/enums";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";

const router = Router();

const STAFF = [UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;
const ADMINS = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

router.get("/", auth(...STAFF), widgetSettingController.getWidgetSetting);
router.patch(
  "/",
  auth(...ADMINS),
  validateRequest(updateWidgetSettingSchema),
  widgetSettingController.updateWidgetSetting
);

export default router;
