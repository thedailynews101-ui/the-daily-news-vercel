import prisma from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { slugify } from "../../utils/slugify";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.validation";

const generateUniqueSlug = async (name: string, excludeId?: string): Promise<string> => {
  const base = slugify(name) || "category";
  let candidate = base;
  let suffix = 1;

  while (
    await prisma.category.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
};

export const listCategories = async () => {
  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
};

export const createCategory = async (input: CreateCategoryInput) => {
  const existing = await prisma.category.findUnique({ where: { name: input.name } });

  if (existing) {
    throw new AppError(409, "A category with this name already exists.");
  }

  const slug = await generateUniqueSlug(input.name);

  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      position: input.position ?? 0,
    },
  });
};

const findCategoryOrThrow = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError(404, "Category not found.");
  }

  return category;
};

export const updateCategory = async (id: string, input: UpdateCategoryInput) => {
  const category = await findCategoryOrThrow(id);

  const data: { name?: string; slug?: string; description?: string; position?: number } = {};

  if (input.name !== undefined && input.name !== category.name) {
    const existing = await prisma.category.findUnique({ where: { name: input.name } });
    if (existing && existing.id !== category.id) {
      throw new AppError(409, "A category with this name already exists.");
    }
    data.name = input.name;
    data.slug = await generateUniqueSlug(input.name, category.id);
  }

  if (input.description !== undefined) data.description = input.description;
  if (input.position !== undefined) data.position = input.position;

  return prisma.category.update({ where: { id: category.id }, data });
};

export const deleteCategory = async (id: string): Promise<void> => {
  await findCategoryOrThrow(id);

  // Articles keep existing (onDelete: SetNull on Article.categoryId) - no
  // article data is lost, they just become uncategorised.
  await prisma.category.delete({ where: { id } });
};
