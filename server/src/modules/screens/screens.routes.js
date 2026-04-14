import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { createScreen, deleteScreen, getScreenSeatTypes, listScreens, updateScreen } from "./screens.controller.js";
import {
  createScreenSchema,
  listScreensSchema,
  screenIdParamSchema,
  screenSeatTypesSchema,
  updateScreenSchema,
} from "./screens.validation.js";

const router = Router();

router.get("/", requireAuth, validate(listScreensSchema), listScreens);
router.get("/:id/seat-types", requireAuth, validate(screenSeatTypesSchema), getScreenSeatTypes);
router.post("/", requireAuth, requireRole("ADMIN"), validate(createScreenSchema), createScreen);
router.put("/:id", requireAuth, requireRole("ADMIN"), validate(updateScreenSchema), updateScreen);
router.delete("/:id", requireAuth, requireRole("ADMIN"), validate(screenIdParamSchema), deleteScreen);

export default router;
