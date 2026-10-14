import prisma from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type {
  CreateEventGroupInput,
  CreateEventItemInput,
  UpdateEventGroupInput,
  UpdateEventItemInput,
} from "./event.validation";

const groupInclude = {
  items: {
    orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
  },
};

const toGroupDTO = (group: {
  id: string;
  title: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    title: string;
    url: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
}) => ({
  id: group.id,
  title: group.title,
  position: group.position,
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
  items: group.items.map((item) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  })),
});

export const listEventGroups = async () => {
  const groups = await prisma.eventGroup.findMany({
    include: groupInclude,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return groups.map(toGroupDTO);
};

/** Lightweight shape for the public homepage Fixed News column. */
export const listPublicEventGroups = async () => {
  const groups = await prisma.eventGroup.findMany({
    select: {
      id: true,
      title: true,
      position: true,
      items: {
        select: { id: true, title: true, url: true, position: true },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return groups;
};

export const createEventGroup = async (input: CreateEventGroupInput) => {
  const group = await prisma.eventGroup.create({
    data: {
      title: input.title,
      position: input.position ?? 0,
    },
    include: groupInclude,
  });

  return toGroupDTO(group);
};

export const updateEventGroup = async (id: string, input: UpdateEventGroupInput) => {
  const existing = await prisma.eventGroup.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Event group not found.");
  }

  const group = await prisma.eventGroup.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    },
    include: groupInclude,
  });

  return toGroupDTO(group);
};

export const deleteEventGroup = async (id: string): Promise<void> => {
  const existing = await prisma.eventGroup.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new AppError(404, "Event group not found.");
  }

  await prisma.eventGroup.delete({ where: { id } });
};

export const createEventItem = async (groupId: string, input: CreateEventItemInput) => {
  const group = await prisma.eventGroup.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!group) {
    throw new AppError(404, "Event group not found.");
  }

  const item = await prisma.eventItem.create({
    data: {
      groupId,
      title: input.title,
      url: input.url,
      position: input.position ?? 0,
    },
  });

  return {
    id: item.id,
    groupId: item.groupId,
    title: item.title,
    url: item.url,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const updateEventItem = async (id: string, input: UpdateEventItemInput) => {
  const existing = await prisma.eventItem.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Event item not found.");
  }

  const item = await prisma.eventItem.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    },
  });

  return {
    id: item.id,
    groupId: item.groupId,
    title: item.title,
    url: item.url,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const deleteEventItem = async (id: string): Promise<void> => {
  const existing = await prisma.eventItem.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new AppError(404, "Event item not found.");
  }

  await prisma.eventItem.delete({ where: { id } });
};
