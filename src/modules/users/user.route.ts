import { Router } from "express";
import {
  changePassword,
  deleteMe,
  getAllUsers,
  getMe,
  getUserById,
  updateMe,
  updateUser,
} from "./user.controller.js";
import { authorizeTo, protect } from "../auth/auth.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

// User Management
router.use(protect);
router.route("/me").get(getMe);
router.route("/update-me").patch(updateMe);
router.route("/change-password").patch(changePassword);
router.route("/delete-me").delete(deleteMe);

// Admin-only Management
router.use(authorizeTo(Role.ADMIN));
router.route("/").get(getAllUsers);
router.route("/:userId").get(getUserById).patch(updateUser);

export default router;
