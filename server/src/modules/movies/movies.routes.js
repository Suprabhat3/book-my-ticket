import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { createMovie, deleteMovie, listMovies, updateMovie } from "./movies.controller.js";
import { createMovieSchema, listMoviesSchema, movieIdParamSchema, updateMovieSchema } from "./movies.validation.js";

const router = Router();

router.get("/", requireAuth, validate(listMoviesSchema), listMovies);
router.post("/", requireAuth, requireRole("ADMIN"), validate(createMovieSchema), createMovie);
router.put("/:id", requireAuth, requireRole("ADMIN"), validate(updateMovieSchema), updateMovie);
router.delete("/:id", requireAuth, requireRole("ADMIN"), validate(movieIdParamSchema), deleteMovie);

export default router;
