import { prisma } from "../../config/db.js";

import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../types/category-input-type.js";

export const createCategory = async (
  data: CreateCategoryInput & { slug: string },
) => {
  return await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId || null,
    },
  });
};
export const findManyRoot = async () => {
  return await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
  });
};
export const findBySlug = async (slug: string) => {
  return await prisma.category.findUnique({
    where: { slug },
    include: { children: true, parent: true },
  });
};
export const findById = async (id: string) => {
  return await prisma.category.findUnique({
    where: { id },
    include: { children: true, parent: true },
  });
};
export const update = async (
  id: string,
  data: UpdateCategoryInput & { slug?: string },
) => {
  return await prisma.category.update({
    where: { id },
    data: {
      ...data,
      slug: data.slug,
    },
  });
};
export const remove = async (id: string) => {
  return await prisma.category.delete({
    where: { id },
  });
};
