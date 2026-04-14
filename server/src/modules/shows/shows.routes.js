import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { getShowsPlaceholder } from "./shows.controller.js";

const router = Router();

router.get("/", requireAuth, getShowsPlaceholder);

export default router;
