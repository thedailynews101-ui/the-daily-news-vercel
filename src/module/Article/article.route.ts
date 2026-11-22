import { Router } from "express";

import * as articleController from "./article.controller";
import {
  approveArticleSchema,
  archiveArticleSchema,
  createArticleSchema,
  rejectArticleSchema,
  restoreArticleSchema,
  updateArticleSchema,
} from "./article.validation";
import { homePlacementSchema } from "../PublicArticle/publicArticle.validation";
import auth from "../../middleware/auth";
import { uploadCoverImage } from "../../middleware/upload";
import validateRequest from "../../middleware/validateRequest";
import { UserRole } from "../../generated/prisma/enums";

const router = Router();

const STAFF = [UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

// --- Author (any authenticated user) ---------------------------------------
router.get("/mine", auth(), articleController.getMine);
router.get("/mine/summary", auth(), articleController.getMineSummary);

// --- Staff moderation & homepage placement ----------------------------------
router.get("/queue", auth(...STAFF), articleController.listQueue);
router.get("/home-layout", auth(...STAFF), articleController.getHomeLayout);
router.get("/published", auth(...STAFF), articleController.listPublishedForPlacement);
router.get("/", auth(...STAFF), articleController.listAllArticles);

router.post(
  "/",
  auth(),
  uploadCoverImage,
  validateRequest(createArticleSchema),
  articleController.createArticle
);

router.get("/:id", auth(), articleController.getArticleById);
router.patch(
  "/:id",
  auth(),
  uploadCoverImage,
  validateRequest(updateArticleSchema),
  articleController.updateArticle
);
router.delete("/:id", auth(), articleController.deleteArticle);

router.post("/:id/submit", auth(), articleController.submitArticle);
router.post("/:id/withdraw", auth(), articleController.withdrawArticle);

router.patch(
  "/:id/home-placement",
  auth(...STAFF),
  validateRequest(homePlacementSchema),
  articleController.setHomePlacement
);

router.post(
  "/:id/approve",
  auth(...STAFF),
  validateRequest(approveArticleSchema),
  articleController.approveArticle
);
router.post(
  "/:id/publish",
  auth(...STAFF),
  validateRequest(approveArticleSchema),
  articleController.publishDraft
);
router.post(
  "/:id/reject",
  auth(...STAFF),
  validateRequest(rejectArticleSchema),
  articleController.rejectArticle
);
router.post(
  "/:id/archive",
  auth(...STAFF),
  validateRequest(archiveArticleSchema),
  articleController.archiveArticle
);
router.post(
  "/:id/restore",
  auth(...STAFF),
  validateRequest(restoreArticleSchema),
  articleController.restoreArticle
);

export default router;
