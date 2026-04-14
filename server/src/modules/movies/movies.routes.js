import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { getMoviesPlaceholder } from "./movies.controller.js";

const router = Router();

router.get("/", requireAuth, getMoviesPlaceholder);

export default router;
