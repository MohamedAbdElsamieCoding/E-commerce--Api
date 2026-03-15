import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than zero"),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  categoryId: z.string().uuid("Invalid category ID"),
  images: z.array(z.string().url("Invalid image URL")).optional(),
});

export const updateProductSchema = createProductSchema.partial();
