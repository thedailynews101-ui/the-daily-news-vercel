import { z } from "zod";

import { UserRole } from "../../generated/prisma/enums";

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

export const listUsersQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  role: z.enum(UserRole).optional(),
  page,
  limit,
});

export const updateUserRoleSchema = z.object({
  role: z.enum(UserRole),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
