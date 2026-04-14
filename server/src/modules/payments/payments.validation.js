import { z } from "zod";

export const paymentsBaseSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const completePaymentSchema = z.object({
  body: z.object({
    success: z.boolean(),
    paymentId: z.string().trim().min(1).optional(),
  }),
  params: z.object({
    bookingId: z.string().trim().min(1),
  }),
  query: z.object({}).optional(),
});
