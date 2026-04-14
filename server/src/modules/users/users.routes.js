import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { getUsersPlaceholder } from "./users.controller.js";

const router = Router();

router.get("/", requireAuth, getUsersPlaceholder);

export default router;
