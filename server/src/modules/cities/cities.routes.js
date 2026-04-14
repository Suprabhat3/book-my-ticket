import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { cityIdParamSchema, createCitySchema, listCitiesSchema, updateCitySchema } from "./cities.validation.js";
import { createCity, deleteCity, listCities, listPublicCities, updateCity } from "./cities.controller.js";

const router = Router();

router.get("/public", validate(listCitiesSchema), listPublicCities);
router.get("/", requireAuth, validate(listCitiesSchema), listCities);
router.post("/", requireAuth, requireRole("ADMIN"), validate(createCitySchema), createCity);
router.put("/:id", requireAuth, requireRole("ADMIN"), validate(updateCitySchema), updateCity);
router.delete("/:id", requireAuth, requireRole("ADMIN"), validate(cityIdParamSchema), deleteCity);

export default router;
