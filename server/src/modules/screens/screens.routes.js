import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { getScreensPlaceholder } from "./screens.controller.js";

const router = Router();

router.get("/", requireAuth, getScreensPlaceholder);

export default router;
