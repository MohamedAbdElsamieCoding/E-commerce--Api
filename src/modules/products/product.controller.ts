import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../middlewares/async-handler";
import { createProductSchema } from "./product.schema";
import { AppError } from "../../utils/app-error";
import { httpStatusText } from "../../utils/http-status-text";
import { prisma } from "../../config/db";
import slugify from "slugify";
import { sendResponse } from "../../utils/response";

export const createProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = createProductSchema.parse(req.body);
    const merchantId = req.user?.id as string;
    if (!merchantId)
      return next(
        new AppError(
          "Merchant ID not found. Ensure you are authenticated.",
          httpStatusText.FAIL,
          401,
        ),
      );
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!categoryExists)
      return new AppError("Category not found", httpStatusText.FAIL, 404);

    const baseSlug = slugify(data.name, { lower: true, strict: true });
    let uniqueSlug = baseSlug;
    let slugCounter = 1;

    while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    const product = await prisma.product.create({
      data: { ...data, slug: uniqueSlug, merchantId },
      include: { category: true },
    });

    sendResponse(
      res,
      201,
      httpStatusText.SUCCESS,
      "Product created successfully",
      { data: product },
    );
  },
);
