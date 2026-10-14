import { z } from "zod";

const text = z.string().trim().min(1, "Quote text is required").max(500);
const authorName = z.string().trim().min(1, "Author name is required").max(120);

export const createQuoteSchema = z.object({
  text,
  authorName,
  isActive: z.boolean().optional(),
});

export const updateQuoteSchema = z
  .object({
    text: text.optional(),
    authorName: authorName.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.text !== undefined || value.authorName !== undefined || value.isActive !== undefined,
    { message: "At least one field is required." }
  );

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
