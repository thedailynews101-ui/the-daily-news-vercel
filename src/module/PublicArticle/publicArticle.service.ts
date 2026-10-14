import { ArticleStatus, HomeSlot } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import AppError from "../../utils/AppError";
import * as eventService from "../Event/event.service";
import type { HomePlacementInput, SearchQuery } from "./publicArticle.validation";

const publicInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.ArticleInclude;

type PublicArticleRow = Prisma.ArticleGetPayload<{ include: typeof publicInclude }>;

/** Only live, published, non-deleted articles may appear on the public site. */
export const publishedWhere = (): Prisma.ArticleWhereInput => ({
  status: ArticleStatus.APPROVED,
  deletedAt: null,
  publishedAt: { not: null, lte: new Date() },
});

const toPublicCard = (article: PublicArticleRow) => ({
  id: article.id,
  slug: article.slug,
  title: article.title,
  excerpt: article.excerpt,
  coverImageUrl: article.coverImageUrl,
  isFeatured: article.isFeatured,
  isBreaking: article.isBreaking,
  homeSlot: article.homeSlot,
  homeRank: article.homeRank,
  readTimeMinutes: article.readTimeMinutes,
  author: article.author,
  category: article.category,
  tags: article.tags.map((row) => row.tag),
  publishedAt: article.publishedAt,
});

const toPublicDetail = (article: PublicArticleRow) => ({
  ...toPublicCard(article),
  content: article.content,
  viewCount: article.viewCount,
});

const SLOT_CAPS: Record<HomeSlot, number> = {
  HERO: 8,
  MEGA: 1,
  FEED: 8,
  VISUAL: 6,
  PINNED: 12,
};

export const getHomeLayout = async () => {
  const [articles, eventGroups] = await Promise.all([
    prisma.article.findMany({
      where: {
        ...publishedWhere(),
        homeSlot: { not: null },
      },
      include: publicInclude,
      orderBy: [{ homeRank: "asc" }, { publishedAt: "desc" }],
    }),
    eventService.listPublicEventGroups(),
  ]);

  const bySlot = (slot: HomeSlot) =>
    articles
      .filter((article) => article.homeSlot === slot)
      .slice(0, SLOT_CAPS[slot])
      .map(toPublicCard);

  const megaList = bySlot(HomeSlot.MEGA);

  return {
    hero: bySlot(HomeSlot.HERO),
    mega: megaList[0] ?? null,
    feed: bySlot(HomeSlot.FEED),
    visual: bySlot(HomeSlot.VISUAL),
    // Fixed News is now driven by event groups; keep empty for backward-compatible clients.
    pinned: [] as ReturnType<typeof toPublicCard>[],
    eventGroups,
  };
};

export const getPublishedBySlug = async (slug: string) => {
  const article = await prisma.article.findFirst({
    where: { slug, ...publishedWhere() },
    include: publicInclude,
  });

  if (!article) {
    throw new AppError(404, "Article not found.");
  }

  // Fire-and-forget view increment; failures should not block the response.
  void prisma.article
    .update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => undefined);

  return toPublicDetail(article);
};

export const searchPublished = async (query: SearchQuery) => {
  const q = query.q.trim();
  const page = query.page;
  const limit = query.limit;

  if (q.length < 2) {
    return {
      items: [],
      meta: { page, limit, total: 0, totalPages: 1, q },
    };
  }

  const where: Prisma.ArticleWhereInput = {
    ...publishedWhere(),
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
    ],
  };

  const [rows, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: publicInclude,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  // Prefer title hits at the top of the current page without a second query.
  const lower = q.toLowerCase();
  const items = [...rows]
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(lower) ? 0 : 1;
      const bTitle = b.title.toLowerCase().includes(lower) ? 0 : 1;
      return aTitle - bTitle;
    })
    .map(toPublicCard);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      q,
    },
  };
};

/** Staff: list published articles eligible for homepage placement. */
export const listPublishedForPlacement = async (params: {
  q?: string;
  page?: number;
  limit?: number;
}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const q = params.q?.trim();

  const where: Prisma.ArticleWhereInput = {
    ...publishedWhere(),
    ...(q && q.length >= 2
      ? { title: { contains: q, mode: "insensitive" as const } }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: publicInclude,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items: rows.map(toPublicCard),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

export const setHomePlacement = async (id: string, input: HomePlacementInput) => {
  const article = await prisma.article.findFirst({
    where: { id, deletedAt: null },
    include: publicInclude,
  });

  if (!article) {
    throw new AppError(404, "Article not found.");
  }

  if (input.homeSlot !== null) {
    const isLive =
      article.status === ArticleStatus.APPROVED &&
      article.publishedAt !== null &&
      article.publishedAt <= new Date();

    if (!isLive) {
      throw new AppError(409, "Only published articles can be placed on the homepage.");
    }
  }

  // Enforce a single MEGA story.
  if (input.homeSlot === HomeSlot.MEGA) {
    await prisma.article.updateMany({
      where: { homeSlot: HomeSlot.MEGA, id: { not: id } },
      data: { homeSlot: null, homeRank: 0 },
    });
  }

  const updated = await prisma.article.update({
    where: { id },
    data: {
      homeSlot: input.homeSlot,
      homeRank: input.homeSlot === null ? 0 : (input.homeRank ?? 0),
    },
    include: publicInclude,
  });

  return toPublicCard(updated);
};
