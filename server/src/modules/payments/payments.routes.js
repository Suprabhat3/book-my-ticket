import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { completePayment, listPayments } from "./payments.controller.js";
import { completePaymentSchema } from "./payments.validation.js";

const router = Router();

router.get("/", requireAuth, listPayments);
router.post("/booking/:bookingId/complete", requireAuth, validate(completePaymentSchema), completePayment);

export default router;
