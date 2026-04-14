import { Router } from "express";
import { optionalAuth, requireAuth, requireRole } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import {
	createShow,
	getPublicShowSeatMap,
	lockShowSeats,
	listPublicShows,
	listShows,
	removeShow,
	unlockShowSeats,
	updateShow,
} from "./shows.controller.js";
import {
	createShowSchema,
	listShowsSchema,
	lockShowSeatsSchema,
	showIdParamSchema,
	unlockShowSeatsSchema,
	updateShowSchema,
} from "./shows.validation.js";

const router = Router();

router.get("/public", validate(listShowsSchema), listPublicShows);
router.get("/public/:id/seats", optionalAuth, validate(showIdParamSchema), getPublicShowSeatMap);
router.post("/:id/seat-locks", requireAuth, validate(lockShowSeatsSchema), lockShowSeats);
router.delete("/:id/seat-locks", requireAuth, validate(unlockShowSeatsSchema), unlockShowSeats);
router.get("/", requireAuth, validate(listShowsSchema), listShows);
router.post("/", requireAuth, requireRole("ADMIN"), validate(createShowSchema), createShow);
router.put("/:id", requireAuth, requireRole("ADMIN"), validate(updateShowSchema), updateShow);
router.delete("/:id", requireAuth, requireRole("ADMIN"), validate(showIdParamSchema), removeShow);

export default router;
