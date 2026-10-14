import { Prisma } from "../../generated/prisma/client";
import { UserRole } from "../../generated/prisma/enums";
import prisma from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { ListUsersQuery, UpdateUserRoleInput } from "./user.validation";

const ROLE_RANK: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  EMPLOYEE: 2,
  USER: 1,
};

export type ActingUser = { id: string; role: UserRole };

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  createdAt: Date;
};

const toManagedUser = (user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  createdAt: Date;
}): ManagedUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

const paginate = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export const isStrictlyHigherRank = (actorRole: UserRole, targetRole: UserRole): boolean =>
  ROLE_RANK[actorRole] > ROLE_RANK[targetRole];

export const assignableRolesFor = (actorRole: UserRole): UserRole[] =>
  (Object.keys(ROLE_RANK) as UserRole[]).filter((role) => isStrictlyHigherRank(actorRole, role));

export const listUsers = async (query: ListUsersQuery) => {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(query.role ? { role: query.role } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: items.map(toManagedUser),
    meta: paginate(query.page, query.limit, total),
  };
};

export const updateUserRole = async (
  actor: ActingUser,
  userId: string,
  input: UpdateUserRoleInput,
  meta?: { ipAddress?: string }
): Promise<ManagedUser> => {
  if (actor.id === userId) {
    throw new AppError(400, "You cannot change your own role.");
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!target) {
    throw new AppError(404, "User not found.");
  }

  if (!isStrictlyHigherRank(actor.role, target.role)) {
    throw new AppError(403, "You can only change roles for users of a lower rank.");
  }

  if (!isStrictlyHigherRank(actor.role, input.role)) {
    throw new AppError(403, "You cannot assign a role equal to or higher than your own.");
  }

  if (target.role === input.role) {
    return toManagedUser(target);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: target.id },
      data: { role: input.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "USER_ROLE_CHANGED",
        entityType: "User",
        entityId: target.id,
        metadata: {
          previousRole: target.role,
          newRole: input.role,
          targetEmail: target.email,
        },
        ipAddress: meta?.ipAddress,
      },
    });

    return user;
  });

  return toManagedUser(updated);
};
