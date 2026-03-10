import {
  createCategorySchema,
  updateCategorySchema,
} from "../modules/categories/category.schema";
import { z } from "zod";

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
