import { Router } from "express";

import * as publicOpinionController from "./publicOpinion.controller";
import {
  createPublicOpinionSchema,
  updatePublicOpinionSchema,
  votePublicOpinionSchema,
} from "./publicOpinion.validation";
import { UserRole } from "../../generated/prisma/enums";
import auth from "../../middleware/auth";
import optionalAuth from "../../middleware/optionalAuth";
import validateRequest from "../../middleware/validateRequest";

const router = Router();

const STAFF = [UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

router.get("/active", optionalAuth(), publicOpinionController.getActivePublicOpinion);
router.post(
  "/:id/vote",
  optionalAuth(),
  validateRequest(votePublicOpinionSchema),
  publicOpinionController.votePublicOpinion
);

router.get("/", auth(...STAFF), publicOpinionController.listPublicOpinions);
router.post(
  "/",
  auth(...STAFF),
  validateRequest(createPublicOpinionSchema),
  publicOpinionController.createPublicOpinion
);
router.patch(
  "/:id",
  auth(...STAFF),
  validateRequest(updatePublicOpinionSchema),
  publicOpinionController.updatePublicOpinion
);
router.delete("/:id", auth(...STAFF), publicOpinionController.deletePublicOpinion);

export default router;
