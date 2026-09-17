import { z } from "zod";

import { HomeSlot } from "../../generated/prisma/enums";

export const searchQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const homePlacementSchema = z.object({
  homeSlot: z.enum(HomeSlot).nullable(),
  homeRank: z.coerce.number().int().min(0).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type HomePlacementInput = z.infer<typeof homePlacementSchema>;
