import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { createShow, listShows, removeShow, updateShow } from "./shows.controller.js";
import { createShowSchema, listShowsSchema, showIdParamSchema, updateShowSchema } from "./shows.validation.js";

const router = Router();

router.get("/", requireAuth, validate(listShowsSchema), listShows);
router.post("/", requireAuth, requireRole("ADMIN"), validate(createShowSchema), createShow);
router.put("/:id", requireAuth, requireRole("ADMIN"), validate(updateShowSchema), updateShow);
router.delete("/:id", requireAuth, requireRole("ADMIN"), validate(showIdParamSchema), removeShow);

export default router;
