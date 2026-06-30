import * as z from "zod";

export const LocationSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const AlertSchema = z.object({
  severity: z.number().gte(1).lte(5),
  status: z.string(),
  location: LocationSchema.optional(),
});

export const CameraSchema = z.object({
  name: z.string(),
  status: z.enum(["active", "inactive", "fault"]),
  location: LocationSchema,
  direction: z.number().gte(0).lte(360).optional(),
});

export type AlertInput = z.infer<typeof AlertSchema>;
export type CameraInput = z.infer<typeof CameraSchema>;
export type LocationInput = z.infer<typeof LocationSchema>;
