import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { getTheatersPlaceholder } from "./theaters.controller.js";

const router = Router();

router.get("/", requireAuth, getTheatersPlaceholder);

export default router;
