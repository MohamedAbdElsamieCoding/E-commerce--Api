import { Router } from "express";
import { login, logout, refreshToken, register } from "./auth.controller.js";
import { protect } from "./auth.middleware.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh-token").post(refreshToken);
router.route("/logout").post(protect, logout);

export default router;
