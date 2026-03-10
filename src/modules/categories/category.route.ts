import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
} from "./category.controller";

const router = Router();

router.route("/").post(createCategory).get(getAllCategories);
router
  .route("/:id")
  .get(getCategoryById)
  .patch(updateCategory)
  .delete(deleteCategory);
router.route("/slug/:slug").get(getCategoryBySlug);

export default router;
