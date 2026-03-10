import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../middlewares/async-handler";
import { AppError } from "../../utils/app-error";
import { httpStatusText } from "../../utils/http-status-text";
import { createCategorySchema, updateCategorySchema } from "./category.schema";
import { sendResponse } from "../../utils/response";
import {
  createCategoryService,
  deleteCategoryService,
  getAllCategoriesService,
  getCategoryByIdService,
  getCategoryBySlugService,
  updateCategoryService,
} from "./category.service";

export const createCategory = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = createCategorySchema.parse(req.body);

    const category = await createCategoryService(data);

    sendResponse(
      res,
      201,
      httpStatusText.SUCCESS,
      "Category created successfully",
      { data: category },
    );
  },
);

export const getAllCategories = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const categories = await getAllCategoriesService();

    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Categories fetched successfully",
      { data: categories },
    );
  },
);

export const getCategoryBySlug = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const slug = req.params.slug as string;
    const category = await getCategoryBySlugService(slug);

    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Category fetched successfully",
      { data: category },
    );
  },
);

export const getCategoryById = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const id = req.params.id as string;
    const category = await getCategoryByIdService(id);

    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Category fetched successfully",
      { data: category },
    );
  },
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const id = req.params.id as string;
    const data = updateCategorySchema.parse(req.body);

    const category = await updateCategoryService(id, data);

    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Category updated successfully",
      { data: category },
    );
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const id = req.params.id as string;

    await deleteCategoryService(id);

    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Category deleted successfully",
      null,
    );
  },
);
