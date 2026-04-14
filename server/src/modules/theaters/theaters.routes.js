import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { createTheater, deleteTheater, listTheaters, updateTheater } from "./theaters.controller.js";
import {
  createTheaterSchema,
  listTheatersSchema,
  theaterIdParamSchema,
  updateTheaterSchema,
} from "./theaters.validation.js";

const router = Router();

router.get("/", requireAuth, validate(listTheatersSchema), listTheaters);
router.post("/", requireAuth, requireRole("ADMIN"), validate(createTheaterSchema), createTheater);
router.put("/:id", requireAuth, requireRole("ADMIN"), validate(updateTheaterSchema), updateTheater);
router.delete("/:id", requireAuth, requireRole("ADMIN"), validate(theaterIdParamSchema), deleteTheater);

export default router;
