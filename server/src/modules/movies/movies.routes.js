import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import {
	createMovie,
	deleteMovie,
	getPublicMovieDetails,
	getUploadAuth,
	listMovies,
	listPublicMovies,
	updateMovie,
} from "./movies.controller.js";
import {
	createMovieSchema,
	listMoviesSchema,
	movieIdParamSchema,
	moviePublicDetailsParamSchema,
	updateMovieSchema,
} from "./movies.validation.js";

const router = Router();

router.get("/public", validate(listMoviesSchema), listPublicMovies);
router.get("/public/:id", validate(moviePublicDetailsParamSchema), getPublicMovieDetails);
router.get("/", requireAuth, validate(listMoviesSchema), listMovies);
router.get("/upload-auth", requireAuth, requireRole("ADMIN"), getUploadAuth);
router.post("/", requireAuth, requireRole("ADMIN"), validate(createMovieSchema), createMovie);
router.put("/:id", requireAuth, requireRole("ADMIN"), validate(updateMovieSchema), updateMovie);
router.delete("/:id", requireAuth, requireRole("ADMIN"), validate(movieIdParamSchema), deleteMovie);

export default router;
