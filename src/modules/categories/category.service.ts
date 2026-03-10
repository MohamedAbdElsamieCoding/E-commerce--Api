import slugify from "slugify";

import { AppError } from "../../utils/app-error.js";
import { httpStatusText } from "../../utils/http-status-text.js";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../types/category-input-type.js";
import * as categoryRepository from "./category.repository.js";

export const createCategoryService = async (data: CreateCategoryInput) => {
  const slug = slugify(data.name, { lower: true, strict: true });

  if (data.parentId) {
    const parent = await categoryRepository.findById(data.parentId);
    if (!parent)
      throw new AppError("Parent category not found", httpStatusText.FAIL, 404);
  }

  return await categoryRepository.createCategory({ ...data, slug });
};

export const getAllCategoriesService = async () => {
  return await categoryRepository.findManyRoot();
};

export const getCategoryBySlugService = async (slug: string) => {
  const category = await categoryRepository.findBySlug(slug);
  if (!category)
    throw new AppError("Category not found", httpStatusText.FAIL, 404);

  return category;
};

export const getCategoryByIdService = async (id: string) => {
  const category = await categoryRepository.findById(id);
  if (!category)
    throw new AppError("Category not found", httpStatusText.FAIL, 404);
  return category;
};

export const updateCategoryService = async (
  id: string,
  data: UpdateCategoryInput,
) => {
  let slug: string | undefined;
  if (data.name) {
    slug = slugify(data.name, { lower: true, strict: true });
  }
  if (data.parentId) {
    const parent = await categoryRepository.findById(data.parentId);
    if (!parent)
      throw new AppError("Parent category not found", httpStatusText.FAIL, 404);
  }

  return await categoryRepository.update(id, { ...data, slug });
};

export const deleteCategoryService = async (id: string) => {
  return await categoryRepository.remove(id);
};
