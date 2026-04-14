import { z } from "zod";

export const listTheatersSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    cityId: z.coerce.number().int().positive().optional(),
    includeInactive: z.enum(["true", "false"]).optional(),
    search: z.string().trim().optional(),
  }),
});

export const createTheaterSchema = z.object({
  body: z.object({
    cityId: z.coerce.number().int().positive(),
    name: z.string().trim().min(2).max(120),
    addressLine: z.string().trim().min(3).max(255),
    pincode: z.string().trim().min(3).max(12).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateTheaterSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      addressLine: z.string().trim().min(3).max(255).optional(),
      pincode: z.string().trim().min(3).max(12).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required to update"),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

export const theaterIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});
