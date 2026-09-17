import { ArticleStatus, ReviewAction, UserRole } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { slugify } from "../../utils/slugify";
import {
  ApproveArticleInput,
  ArchiveArticleInput,
  CreateArticleInput,
  ListArticlesQuery,
  MineArticlesQuery,
  RejectArticleInput,
  RestoreArticleInput,
  UpdateArticleInput,
} from "./article.validation";

export type ActingUser = { id: string; role: UserRole };

const STAFF_ROLES: UserRole[] = [UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN];

const isStaff = (role: UserRole): boolean => STAFF_ROLES.includes(role);

const AUTHOR_EDITABLE_STATUSES: ArticleStatus[] = [ArticleStatus.DRAFT, ArticleStatus.REJECTED];
const AUTHOR_DELETABLE_STATUSES: ArticleStatus[] = [
  ArticleStatus.DRAFT,
  ArticleStatus.PENDING,
  ArticleStatus.REJECTED,
];

const articleInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  reviewedBy: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.ArticleInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

export type ArticleListResult = {
  items: ReturnType<typeof toArticleDTO>[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

const toArticleDTO = (article: ArticleWithRelations) => ({
  id: article.id,
  title: article.title,
  slug: article.slug,
  excerpt: article.excerpt,
  content: article.content,
  coverImageUrl: article.coverImageUrl,
  status: article.status,
  isFeatured: article.isFeatured,
  isBreaking: article.isBreaking,
  readTimeMinutes: article.readTimeMinutes,
  viewCount: article.viewCount,
  author: article.author,
  category: article.category,
  tags: article.tags.map((articleTag) => articleTag.tag),
  submittedAt: article.submittedAt,
  reviewedBy: article.reviewedBy,
  reviewedAt: article.reviewedAt,
  rejectionReason: article.rejectionReason,
  publishedAt: article.publishedAt,
  createdAt: article.createdAt,
  updatedAt: article.updatedAt,
});

/** Slugifies the title and appends `-2`, `-3`, ... until the slug is free. */
const generateUniqueSlug = async (title: string, excludeId?: string): Promise<string> => {
  const base = slugify(title) || "article";
  let candidate = base;
  let suffix = 1;

  while (
    await prisma.article.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
};

/** Upserts tags by name (matched on slug) and merges them with any given ids. */
const resolveTagIds = async (tagNames?: string[], tagIds?: string[]): Promise<string[]> => {
  const ids = new Set<string>(tagIds ?? []);

  if (tagNames && tagNames.length > 0) {
    for (const rawName of tagNames) {
      const name = rawName.trim();
      if (!name) continue;

      const slug = slugify(name);
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: {},
        create: { name, slug },
      });
      ids.add(tag.id);
    }
  }

  return Array.from(ids);
};

const findArticleOrThrow = async (id: string): Promise<ArticleWithRelations> => {
  const article = await prisma.article.findFirst({
    where: { id, deletedAt: null },
    include: articleInclude,
  });

  if (!article) {
    throw new AppError(404, "Article not found.");
  }

  return article;
};

const assertViewAccess = (user: ActingUser, article: ArticleWithRelations): void => {
  if (isStaff(user.role) || article.authorId === user.id) {
    return;
  }

  const isPublished =
    article.status === ArticleStatus.APPROVED &&
    article.publishedAt !== null &&
    article.publishedAt <= new Date();

  if (!isPublished) {
    throw new AppError(403, "You do not have permission to view this article.");
  }
};

const assertEditAccess = (user: ActingUser, article: ArticleWithRelations): void => {
  if (isStaff(user.role)) {
    return;
  }

  if (article.authorId !== user.id) {
    throw new AppError(403, "You can only edit your own articles.");
  }

  if (!AUTHOR_EDITABLE_STATUSES.includes(article.status)) {
    throw new AppError(
      409,
      "This article can no longer be edited. Withdraw it first if it is pending review."
    );
  }
};

const assertDeleteAccess = (user: ActingUser, article: ArticleWithRelations): void => {
  if (isStaff(user.role)) {
    return;
  }

  if (article.authorId !== user.id) {
    throw new AppError(403, "You can only delete your own articles.");
  }

  if (!AUTHOR_DELETABLE_STATUSES.includes(article.status)) {
    throw new AppError(
      409,
      "Published articles cannot be deleted directly. Ask staff to archive it instead."
    );
  }
};

const buildCategoryUpdate = (
  categoryId: string | null | undefined
): Prisma.ArticleUpdateInput["category"] | undefined => {
  if (categoryId === undefined) return undefined;
  return categoryId ? { connect: { id: categoryId } } : { disconnect: true };
};

const paginate = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export const createArticle = async (
  user: ActingUser,
  input: CreateArticleInput
): Promise<ReturnType<typeof toArticleDTO>> => {
  const staff = isStaff(user.role);
  const slug = await generateUniqueSlug(input.title);
  const tagIds = await resolveTagIds(input.tagNames, input.tagIds);

  const status = staff ? (input.status ?? ArticleStatus.DRAFT) : ArticleStatus.DRAFT;
  const isDirectPublish = staff && status === ArticleStatus.APPROVED;

  const article = await prisma.article.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      readTimeMinutes: input.readTimeMinutes ?? 1,
      status,
      isFeatured: staff ? (input.isFeatured ?? false) : false,
      isBreaking: staff ? (input.isBreaking ?? false) : false,
      author: { connect: { id: user.id } },
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      ...(isDirectPublish
        ? {
            reviewedBy: { connect: { id: user.id } },
            reviewedAt: new Date(),
            publishedAt: input.publishedAt ?? new Date(),
          }
        : {}),
      ...(tagIds.length > 0 ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } } : {}),
    },
    include: articleInclude,
  });

  return toArticleDTO(article);
};

export const getArticleById = async (
  user: ActingUser,
  id: string
): Promise<ReturnType<typeof toArticleDTO>> => {
  const article = await findArticleOrThrow(id);
  assertViewAccess(user, article);
  return toArticleDTO(article);
};

export const updateArticle = async (
  user: ActingUser,
  id: string,
  input: UpdateArticleInput
): Promise<ReturnType<typeof toArticleDTO>> => {
  const article = await findArticleOrThrow(id);
  assertEditAccess(user, article);

  const staff = isStaff(user.role);
  const data: Prisma.ArticleUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
    data.slug = await generateUniqueSlug(input.title, article.id);
  }
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.content !== undefined) data.content = input.content;
  if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl;
  if (input.readTimeMinutes !== undefined) data.readTimeMinutes = input.readTimeMinutes;

  const categoryUpdate = buildCategoryUpdate(input.categoryId);
  if (categoryUpdate !== undefined) data.category = categoryUpdate;

  if (staff) {
    if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
    if (input.isBreaking !== undefined) data.isBreaking = input.isBreaking;
  }

  if (input.tagNames !== undefined || input.tagIds !== undefined) {
    const tagIds = await resolveTagIds(input.tagNames, input.tagIds);
    data.tags = {
      deleteMany: {},
      create: tagIds.map((tagId) => ({ tagId })),
    };
  }

  const updated = await prisma.article.update({
    where: { id: article.id },
    data,
    include: articleInclude,
  });

  return toArticleDTO(updated);
};

export const deleteArticle = async (user: ActingUser, id: string): Promise<void> => {
  const article = await findArticleOrThrow(id);
  assertDeleteAccess(user, article);

  await prisma.article.update({
    where: { id: article.id },
    data: { deletedAt: new Date() },
  });
};

export const submitArticle = async (
  user: ActingUser,
  id: string
): Promise<ReturnType<typeof toArticleDTO>> => {
  const article = await findArticleOrThrow(id);

  if (article.authorId !== user.id) {
    throw new AppError(403, "You can only submit your own articles.");
  }

  if (article.status !== ArticleStatus.DRAFT && article.status !== ArticleStatus.REJECTED) {
    throw new AppError(409, `An article with status ${article.status} cannot be submitted.`);
  }

  const updated = await prisma.article.update({
    where: { id: article.id },
    data: {
      status: ArticleStatus.PENDING,
      submittedAt: new Date(),
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
    },
    include: articleInclude,
  });

  return toArticleDTO(updated);
};

export const withdrawArticle = async (
  user: ActingUser,
  id: string
): Promise<ReturnType<typeof toArticleDTO>> => {
  const article = await findArticleOrThrow(id);

  if (article.authorId !== user.id) {
    throw new AppError(403, "You can only withdraw your own articles.");
  }

  if (article.status !== ArticleStatus.PENDING) {
    throw new AppError(409, "Only pending articles can be withdrawn.");
  }

  const updated = await prisma.article.update({
    where: { id: article.id },
    data: { status: ArticleStatus.DRAFT, submittedAt: null },
    include: articleInclude,
  });

  return toArticleDTO(updated);
};

export const listMine = async (
  user: ActingUser,
  query: MineArticlesQuery
): Promise<ArticleListResult> => {
  const where: Prisma.ArticleWhereInput = {
    authorId: user.id,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.article.count({ where }),
  ]);

  return { items: items.map(toArticleDTO), meta: paginate(query.page, query.limit, total) };
};

export const getMySummary = async (
  user: ActingUser
): Promise<Record<ArticleStatus, number>> => {
  const counts = await prisma.article.groupBy({
    by: ["status"],
    where: { authorId: user.id, deletedAt: null },
    _count: { _all: true },
  });

  const summary: Record<ArticleStatus, number> = {
    DRAFT: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  };

  for (const row of counts) {
    summary[row.status] = row._count._all;
  }

  return summary;
};

export const listAll = async (query: ListArticlesQuery): Promise<ArticleListResult> => {
  const where: Prisma.ArticleWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.authorId ? { authorId: query.authorId } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.article.count({ where }),
  ]);

  return { items: items.map(toArticleDTO), meta: paginate(query.page, query.limit, total) };
};

export const listQueue = async (): Promise<ReturnType<typeof toArticleDTO>[]> => {
  const items = await prisma.article.findMany({
    where: { status: ArticleStatus.PENDING, deletedAt: null },
    include: articleInclude,
    orderBy: { submittedAt: "asc" },
  });

  return items.map(toArticleDTO);
};

/** Applies a moderation decision and its `ArticleReview` audit row in one transaction. */
const recordDecision = async (params: {
  articleId: string;
  reviewerId: string;
  action: ReviewAction;
  note?: string;
  data: Prisma.ArticleUpdateInput;
}): Promise<ReturnType<typeof toArticleDTO>> => {
  const [updated] = await prisma.$transaction([
    prisma.article.update({
      where: { id: params.articleId },
      data: params.data,
      include: articleInclude,
    }),
    prisma.articleReview.create({
      data: {
        articleId: params.articleId,
        reviewerId: params.reviewerId,
        action: params.action,
        note: params.note,
      },
    }),
  ]);

  return toArticleDTO(updated);
};

export const approveArticle = async (
  reviewer: ActingUser,
  id: string,
  input: ApproveArticleInput
): Promise<ReturnType<typeof toArticleDTO>> => {
  const article = await findArticleOrThrow(id);

  if (article.status !== ArticleStatus.PENDING) {
    throw new AppError(409, "Only pending articles can be approved.");
  }

  return recordDecision({
    articleId: article.id,
    reviewerId: reviewer.id,
    action: ReviewAction.APPROVED,
    note: input.note,
    data: {
      status: ArticleStatus.APPROVED,
      reviewedBy: { connect: { id: reviewer.id } },
      reviewedAt: new Date(),
      rejectionReason: null,
      publishedAt: input.publishedAt ?? new Date(),
    },
  });
};

/** Staff-only: publish a newsroom draft without going through the user moderation queue. */
export const publishDraft = async (
  staff: ActingUser,
  id: string,
  input: ApproveArticleInput = {}
): Promise<ReturnType<typeof toArticleDTO>> => {
  if (!isStaff(staff.role)) {
    throw new AppError(403, "Only staff can publish drafts directly.");
  }

  const article = await findArticleOrThrow(id);

  if (article.status !== ArticleStatus.DRAFT) {
    throw new AppError(409, "Only draft articles can be published this way.");
  }

  return recordDecision({
    articleId: article.id,
    reviewerId: staff.id,
    action: ReviewAction.APPROVED,
    note: input.note,
    data: {
      status: ArticleStatus.APPROVED,
      reviewedBy: { connect: { id: staff.id } },
      reviewedAt: new Date(),
      rejectionReason: null,
      publishedAt: input.publishedAt ?? new Date(),
    },
  });
};

export const rejectArticle = async (
  reviewer: ActingUser,
  id: string,
  input: RejectArticleInput
): Promise<ReturnType<typeof toArticleDTO>> => {
  const article = await findArticleOrThrow(id);

  if (article.status !== ArticleStatus.PENDING) {
    throw new AppError(409, "Only pending articles can be rejected.");
  }

  return recordDecision({
    articleId: article.id,
    reviewerId: reviewer.id,
    action: ReviewAction.REJECTED,
    note: input.reason,
    data: {
      status: ArticleStatus.REJECTED,
      reviewedBy: { connect: { id: reviewer.id } },
      reviewedAt: new Date(),
      rejectionReason: input.reason,
    },
  });
};

export const archiveArticle = async (
  reviewer: ActingUser,
  id: string,
  input: ArchiveArticleInput
): Promise<ReturnType<typeof toArticleDTO>> => {
  const article = await findArticleOrThrow(id);

  if (article.status !== ArticleStatus.APPROVED) {
    throw new AppError(409, "Only approved articles can be archived.");
  }

  return recordDecision({
    articleId: article.id,
    reviewerId: reviewer.id,
    action: ReviewAction.ARCHIVED,
    note: input.note,
    data: {
      status: ArticleStatus.ARCHIVED,
      reviewedBy: { connect: { id: reviewer.id } },
      reviewedAt: new Date(),
    },
  });
};

export const restoreArticle = async (
  reviewer: ActingUser,
  id: string,
  input: RestoreArticleInput
): Promise<ReturnType<typeof toArticleDTO>> => {
  const article = await findArticleOrThrow(id);

  if (article.status !== ArticleStatus.ARCHIVED) {
    throw new AppError(409, "Only archived articles can be restored.");
  }

  return recordDecision({
    articleId: article.id,
    reviewerId: reviewer.id,
    action: ReviewAction.RESTORED,
    note: input.note,
    data: {
      status: ArticleStatus.APPROVED,
      reviewedBy: { connect: { id: reviewer.id } },
      reviewedAt: new Date(),
      publishedAt: article.publishedAt ?? new Date(),
    },
  });
};
