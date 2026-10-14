import prisma from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type { CreateQuoteInput, UpdateQuoteInput } from "./quote.validation";

const toQuoteDTO = (quote: {
  id: string;
  text: string;
  authorName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: quote.id,
  text: quote.text,
  authorName: quote.authorName,
  isActive: quote.isActive,
  createdAt: quote.createdAt,
  updatedAt: quote.updatedAt,
});

export const listQuotes = async () => {
  const quotes = await prisma.quote.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
  return quotes.map(toQuoteDTO);
};

export const getActiveQuote = async () => {
  const quote = await prisma.quote.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });
  return quote ? toQuoteDTO(quote) : null;
};

export const createQuote = async (input: CreateQuoteInput) => {
  const quote = await prisma.$transaction(async (tx) => {
    if (input.isActive) {
      await tx.quote.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }

    return tx.quote.create({
      data: {
        text: input.text,
        authorName: input.authorName,
        isActive: input.isActive ?? false,
      },
    });
  });

  return toQuoteDTO(quote);
};

export const updateQuote = async (id: string, input: UpdateQuoteInput) => {
  const existing = await prisma.quote.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Quote not found.");
  }

  const quote = await prisma.$transaction(async (tx) => {
    if (input.isActive === true) {
      await tx.quote.updateMany({
        where: { isActive: true, NOT: { id } },
        data: { isActive: false },
      });
    }

    return tx.quote.update({
      where: { id },
      data: {
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(input.authorName !== undefined ? { authorName: input.authorName } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  });

  return toQuoteDTO(quote);
};

export const deleteQuote = async (id: string): Promise<void> => {
  const existing = await prisma.quote.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new AppError(404, "Quote not found.");
  }

  await prisma.quote.delete({ where: { id } });
};
