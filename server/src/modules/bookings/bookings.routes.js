import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { cancelBooking, createBooking, getBookingById, listBookings, listMyBookings } from "./bookings.controller.js";
import { bookingIdParamSchema, cancelBookingSchema, createBookingSchema } from "./bookings.validation.js";

const router = Router();

router.get("/", requireAuth, listBookings);
router.get("/me", requireAuth, listMyBookings);
router.get("/:id", requireAuth, validate(bookingIdParamSchema), getBookingById);
router.post("/:id/cancel", requireAuth, validate(cancelBookingSchema), cancelBooking);
router.post("/", requireAuth, validate(createBookingSchema), createBooking);

export default router;
