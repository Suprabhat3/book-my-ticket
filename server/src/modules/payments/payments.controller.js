import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";
import * as paymentsService from "./payments.service.js";

export const completePayment = asyncHandler(async (req, res) => {
  const booking = await paymentsService.completePayment({
    bookingId: req.validated.params.bookingId,
    requestUser: req.user,
    isSuccess: req.validated.body.success,
    paymentId: req.validated.body.paymentId,
  });

  return sendSuccess(res, {
    message: "Payment processed successfully",
    data: booking,
  });
});

export const listPayments = asyncHandler(async (req, res) => {
  const payments = await paymentsService.listPayments(req.user);

  return sendSuccess(res, {
    message: "Payments fetched successfully",
    data: payments,
  });
});
