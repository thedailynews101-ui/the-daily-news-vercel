import { RequestHandler } from "express";
import multer from "multer";

import AppError from "../utils/AppError";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError(400, "Cover image must be a JPEG, PNG, WebP, or GIF file."));
      return;
    }
    cb(null, true);
  },
});

export const uploadCoverImage: RequestHandler = upload.single("coverImage");
