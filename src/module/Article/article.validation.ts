import { z } from "zod";

import { ArticleStatus } from "../../generated/prisma/enums";

/** Multipart forms send booleans as "true"/"false" strings. */
const booleanFromForm = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

/** Multipart forms send arrays as a JSON string. */
const stringArrayFromForm = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}, z.array(z.string().trim().min(1).max(50)).max(20));

const tagIdsFromForm = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}, z.array(z.string().trim().min(1)).max(20));

/** Empty string from multipart means "no category". */
const categoryIdFromForm = z.preprocess((value) => {
  if (value === "") return null;
  return value;
}, z.string().trim().min(1).nullable().optional());

const title = z.string().trim().min(3, "Title must be at least 3 characters long").max(200);
const content = z.string().trim().min(1, "Content is required");
const excerpt = z.string().trim().max(500, "Excerpt must be at most 500 characters").optional();
const tagNames = stringArrayFromForm.optional();
const tagIds = tagIdsFromForm.optional();
const readTimeMinutes = z.coerce.number().int().min(1).max(240).optional();

// Statuses staff may pick directly at creation time; PENDING/REJECTED/ARCHIVED
// only ever happen through the moderation actions below.
const staffCreatableStatus = z.enum([ArticleStatus.DRAFT, ArticleStatus.APPROVED]);

export const createArticleSchema = z.object({
  title,
  excerpt,
  content,
  categoryId: categoryIdFromForm,
  tagNames,
  tagIds,
  readTimeMinutes,
  // Ignored for USER callers; only staff creation honours these.
  status: staffCreatableStatus.optional(),
  isFeatured: booleanFromForm.optional(),
  isBreaking: booleanFromForm.optional(),
  publishedAt: z.coerce.date().optional(),
});

export const updateArticleSchema = z.object({
  title: title.optional(),
  excerpt,
  content: content.optional(),
  categoryId: categoryIdFromForm,
  tagNames,
  tagIds,
  readTimeMinutes,
  // Ignored for USER callers; only staff updates honour these.
  isFeatured: booleanFromForm.optional(),
  isBreaking: booleanFromForm.optional(),
  removeCoverImage: booleanFromForm.optional(),
});

export const approveArticleSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  publishedAt: z.coerce.date().optional(),
});

export const rejectArticleSchema = z.object({
  reason: z
    .string({ error: "A rejection reason is required" })
    .trim()
    .min(3, "Rejection reason must be at least 3 characters long")
    .max(1000),
});

export const archiveArticleSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

export const restoreArticleSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

const statusFilter = z.enum(ArticleStatus).optional();
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

export const mineArticlesQuerySchema = z.object({
  status: statusFilter,
  page,
  limit,
});

export const listArticlesQuerySchema = z.object({
  status: statusFilter,
  authorId: z.string().trim().min(1).optional(),
  page,
  limit,
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ApproveArticleInput = z.infer<typeof approveArticleSchema>;
export type RejectArticleInput = z.infer<typeof rejectArticleSchema>;
export type ArchiveArticleInput = z.infer<typeof archiveArticleSchema>;
export type RestoreArticleInput = z.infer<typeof restoreArticleSchema>;
export type MineArticlesQuery = z.infer<typeof mineArticlesQuerySchema>;
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;
