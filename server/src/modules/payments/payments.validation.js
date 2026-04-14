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

export const createRazorpayOrderSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    bookingId: z.string().trim().min(1),
  }),
  query: z.object({}).optional(),
});

export const verifyRazorpayPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().trim().min(1),
    razorpayPaymentId: z.string().trim().min(1),
    razorpaySignature: z.string().trim().min(1),
  }),
  params: z.object({
    bookingId: z.string().trim().min(1),
  }),
  query: z.object({}).optional(),
});
