import * as z from "zod";

export const LocationSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const AlertStatusSchema = z.enum(["active", "inactive"]);

export const CameraStatusSchema = z.union([
  AlertStatusSchema,
  z.literal("fault"),
]);

export const AlertSchema = z.object({
  severity: z.number().gte(1).lte(5),
  status: AlertStatusSchema,
  location: LocationSchema.optional(),
});

export const Camera = z.object({
  name: z.string(),
  status: CameraStatusSchema,
  location: LocationSchema,
  direction: z.number().gte(0).lte(360).optional(),
});
