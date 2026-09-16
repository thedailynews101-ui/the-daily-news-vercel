import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100),
  description: z.string().trim().max(500).optional(),
  position: z.coerce.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
