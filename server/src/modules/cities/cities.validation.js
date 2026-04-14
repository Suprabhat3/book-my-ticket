import { z } from "zod";

export const listCitiesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    includeInactive: z.enum(["true", "false"]).optional(),
    search: z.string().trim().optional(),
  }),
});

export const createCitySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    state: z.string().trim().max(80).optional(),
    country: z.string().trim().max(80).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateCitySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      state: z.string().trim().max(80).optional(),
      country: z.string().trim().max(80).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required to update"),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

export const cityIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});
