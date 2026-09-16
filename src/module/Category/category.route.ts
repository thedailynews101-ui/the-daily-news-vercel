import { Router } from "express";

import * as categoryController from "./category.controller";
import { createCategorySchema, updateCategorySchema } from "./category.validation";
import { UserRole } from "../../generated/prisma/enums";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";

const router = Router();

const STAFF = [UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

router.get("/", auth(), categoryController.listCategories);
router.post(
  "/",
  auth(...STAFF),
  validateRequest(createCategorySchema),
  categoryController.createCategory
);
router.patch(
  "/:id",
  auth(...STAFF),
  validateRequest(updateCategorySchema),
  categoryController.updateCategory
);
router.delete("/:id", auth(...STAFF), categoryController.deleteCategory);

export default router;
