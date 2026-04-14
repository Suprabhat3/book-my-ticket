import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import {
	completePayment,
	createRazorpayOrder,
	listPayments,
	verifyRazorpayPayment,
} from "./payments.controller.js";
import {
	completePaymentSchema,
	createRazorpayOrderSchema,
	verifyRazorpayPaymentSchema,
} from "./payments.validation.js";

const router = Router();

router.get("/", requireAuth, listPayments);
router.post(
	"/booking/:bookingId/razorpay-order",
	requireAuth,
	validate(createRazorpayOrderSchema),
	createRazorpayOrder,
);
router.post(
	"/booking/:bookingId/razorpay-verify",
	requireAuth,
	validate(verifyRazorpayPaymentSchema),
	verifyRazorpayPayment,
);
router.post("/booking/:bookingId/complete", requireAuth, validate(completePaymentSchema), completePayment);

export default router;
