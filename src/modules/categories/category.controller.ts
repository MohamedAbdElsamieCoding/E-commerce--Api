import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../middlewares/async-handler";
import { AppError } from "../../utils/app-error";
import { httpStatusText } from "../../utils/http-status-text";
import { prisma } from "../../config/db";
import slugify from "slugify";
import { createCategorySchema } from "./category.schema";
import { sendResponse } from "../../utils/response";

export const createCategory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = createCategorySchema.parse(req.body);
    const slug = slugify(data.name, { lower: true, strict: true });

    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (!parent)
        return next(
          new AppError("Parent category not found", httpStatusText.FAIL, 404),
        );
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId || null,
      },
    });
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
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
    });
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
  async (req: Request, res: Response, next: NextFunction) => {
    const slug = req.params.slug as string;
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
    if (!category)
      return next(new AppError("Category not found", httpStatusText.FAIL, 404));
    sendResponse(
      res,
      200,
      httpStatusText.SUCCESS,
      "Category fetched successfully",
      { data: category },
    );
  },
);
