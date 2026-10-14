import { PublicOpinionStatus } from "../../generated/prisma/enums";
import prisma from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type {
  CreatePublicOpinionInput,
  UpdatePublicOpinionInput,
  VotePublicOpinionInput,
} from "./publicOpinion.validation";

type OptionWithCount = {
  id: string;
  label: string;
  position: number;
  voteCount: number;
  percent: number;
};

const withPercents = (
  options: Array<{ id: string; label: string; position: number; _count: { responses: number } }>
): { options: OptionWithCount[]; totalVotes: number } => {
  const totalVotes = options.reduce((sum, option) => sum + option._count.responses, 0);

  return {
    totalVotes,
    options: options.map((option) => {
      const voteCount = option._count.responses;
      return {
        id: option.id,
        label: option.label,
        position: option.position,
        voteCount,
        percent: totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100),
      };
    }),
  };
};

const optionInclude = {
  options: {
    orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
    include: { _count: { select: { responses: true } } },
  },
};

export const listPublicOpinions = async () => {
  const opinions = await prisma.publicOpinion.findMany({
    include: optionInclude,
    orderBy: [{ createdAt: "desc" }],
  });

  return opinions.map((opinion) => {
    const { options, totalVotes } = withPercents(opinion.options);
    return {
      id: opinion.id,
      question: opinion.question,
      status: opinion.status,
      createdById: opinion.createdById,
      createdAt: opinion.createdAt,
      updatedAt: opinion.updatedAt,
      totalVotes,
      options,
    };
  });
};

export const getActivePublicOpinion = async (voterKey?: string, userId?: string) => {
  const opinion = await prisma.publicOpinion.findFirst({
    where: { status: PublicOpinionStatus.ACTIVE },
    include: {
      options: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: { _count: { select: { responses: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!opinion) return null;

  let hasVoted = false;
  let selectedOptionId: string | null = null;

  if (userId || voterKey) {
    const existing = await prisma.publicOpinionResponse.findFirst({
      where: {
        opinionId: opinion.id,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(voterKey ? [{ voterKey }] : []),
        ],
      },
      select: { optionId: true },
    });
    if (existing) {
      hasVoted = true;
      selectedOptionId = existing.optionId;
    }
  }

  const { options, totalVotes } = withPercents(opinion.options);

  return {
    id: opinion.id,
    question: opinion.question,
    status: opinion.status,
    hasVoted,
    selectedOptionId,
    totalVotes,
    options: hasVoted
      ? options
      : options.map(({ id, label, position }) => ({ id, label, position })),
  };
};

export const createPublicOpinion = async (
  input: CreatePublicOpinionInput,
  createdById: string
) => {
  const opinion = await prisma.$transaction(async (tx) => {
    if (input.activate) {
      await tx.publicOpinion.updateMany({
        where: { status: PublicOpinionStatus.ACTIVE },
        data: { status: PublicOpinionStatus.CLOSED },
      });
    }

    return tx.publicOpinion.create({
      data: {
        question: input.question,
        status: input.activate ? PublicOpinionStatus.ACTIVE : PublicOpinionStatus.DRAFT,
        createdById,
        options: {
          create: input.options.map((label, index) => ({
            label,
            position: index,
          })),
        },
      },
      include: optionInclude,
    });
  });

  const { options, totalVotes } = withPercents(opinion.options);
  return {
    id: opinion.id,
    question: opinion.question,
    status: opinion.status,
    createdById: opinion.createdById,
    createdAt: opinion.createdAt,
    updatedAt: opinion.updatedAt,
    totalVotes,
    options,
  };
};

export const updatePublicOpinion = async (id: string, input: UpdatePublicOpinionInput) => {
  const existing = await prisma.publicOpinion.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Public opinion not found.");
  }

  const opinion = await prisma.$transaction(async (tx) => {
    if (input.status === PublicOpinionStatus.ACTIVE) {
      await tx.publicOpinion.updateMany({
        where: { status: PublicOpinionStatus.ACTIVE, NOT: { id } },
        data: { status: PublicOpinionStatus.CLOSED },
      });
    }

    return tx.publicOpinion.update({
      where: { id },
      data: {
        ...(input.question !== undefined ? { question: input.question } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: optionInclude,
    });
  });

  const { options, totalVotes } = withPercents(opinion.options);
  return {
    id: opinion.id,
    question: opinion.question,
    status: opinion.status,
    createdById: opinion.createdById,
    createdAt: opinion.createdAt,
    updatedAt: opinion.updatedAt,
    totalVotes,
    options,
  };
};

export const deletePublicOpinion = async (id: string): Promise<void> => {
  const existing = await prisma.publicOpinion.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new AppError(404, "Public opinion not found.");
  }

  await prisma.publicOpinion.delete({ where: { id } });
};

export const votePublicOpinion = async (
  id: string,
  input: VotePublicOpinionInput,
  voterKey: string,
  userId?: string
) => {
  const opinion = await prisma.publicOpinion.findUnique({
    where: { id },
    include: {
      options: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: { _count: { select: { responses: true } } },
      },
    },
  });

  if (!opinion) {
    throw new AppError(404, "Public opinion not found.");
  }

  if (opinion.status !== PublicOpinionStatus.ACTIVE) {
    throw new AppError(400, "This public opinion is not accepting votes.");
  }

  const option = opinion.options.find((item) => item.id === input.optionId);
  if (!option) {
    throw new AppError(400, "Selected option does not belong to this question.");
  }

  const alreadyVoted = await prisma.publicOpinionResponse.findFirst({
    where: {
      opinionId: id,
      OR: [{ voterKey }, ...(userId ? [{ userId }] : [])],
    },
    select: { id: true },
  });

  if (alreadyVoted) {
    throw new AppError(409, "You have already answered this question.", "ALREADY_VOTED");
  }

  try {
    await prisma.publicOpinionResponse.create({
      data: {
        opinionId: id,
        optionId: input.optionId,
        voterKey,
        userId: userId ?? null,
      },
    });
  } catch {
    throw new AppError(409, "You have already answered this question.", "ALREADY_VOTED");
  }

  const refreshed = await prisma.publicOpinion.findUniqueOrThrow({
    where: { id },
    include: {
      options: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: { _count: { select: { responses: true } } },
      },
    },
  });

  const { options, totalVotes } = withPercents(refreshed.options);

  return {
    id: refreshed.id,
    question: refreshed.question,
    status: refreshed.status,
    hasVoted: true,
    selectedOptionId: input.optionId,
    totalVotes,
    options,
  };
};
