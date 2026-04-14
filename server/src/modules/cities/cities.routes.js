import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { getCitiesPlaceholder } from "./cities.controller.js";

const router = Router();

router.get("/", requireAuth, getCitiesPlaceholder);

export default router;
