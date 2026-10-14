import { Router } from "express";

import * as quoteController from "./quote.controller";
import { createQuoteSchema, updateQuoteSchema } from "./quote.validation";
import { UserRole } from "../../generated/prisma/enums";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";

const router = Router();

const STAFF = [UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

router.get("/", auth(...STAFF), quoteController.listQuotes);
router.post("/", auth(...STAFF), validateRequest(createQuoteSchema), quoteController.createQuote);
router.patch(
  "/:id",
  auth(...STAFF),
  validateRequest(updateQuoteSchema),
  quoteController.updateQuote
);
router.delete("/:id", auth(...STAFF), quoteController.deleteQuote);

export default router;
