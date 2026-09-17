import { Router } from "express";

import * as categoryController from "./category.controller";
import { createCategorySchema, updateCategorySchema } from "./category.validation";
import { UserRole } from "../../generated/prisma/enums";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";

const router = Router();

/** Category CRUD is admin-only; employees may still list categories for article forms. */
const ADMINS = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

router.get("/", auth(), categoryController.listCategories);
router.post(
  "/",
  auth(...ADMINS),
  validateRequest(createCategorySchema),
  categoryController.createCategory
);
router.patch(
  "/:id",
  auth(...ADMINS),
  validateRequest(updateCategorySchema),
  categoryController.updateCategory
);
router.delete("/:id", auth(...ADMINS), categoryController.deleteCategory);

export default router;
