import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { getBookingsPlaceholder } from "./bookings.controller.js";

const router = Router();

router.get("/", requireAuth, getBookingsPlaceholder);

export default router;
