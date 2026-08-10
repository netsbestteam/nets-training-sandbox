import * as z from "zod";

export const LocationSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const MapBoundsSchema = z.object({
  north: z.number(),
  south: z.number(),
  east: z.number(),
  west: z.number(),
});

export const AlertSchema = z.object({
  severity: z.number().gte(1).lte(5),
  status: z.enum(["open", "closed"]),
  alert_type: z.string().optional(),
  location: LocationSchema.optional(),
  camera_id: z.uuid().optional(),
});

export const CameraSchema = z.object({
  name: z.string(),
  status: z.enum(["active", "inactive", "fault"]),
  location: LocationSchema.optional(),
  direction: z.number().gte(0).lte(360).optional(),
});

export const UpdateAlertStatus = z.object({
  status: z.enum(["open", "closed"]),
});

export const AlertAssignment = z.object({
  investigatorIds: z.array(z.string().uuid()),
});

export type AlertInput = z.infer<typeof AlertSchema>;
export type CameraInput = z.infer<typeof CameraSchema>;
export type LocationInput = z.infer<typeof LocationSchema>;
export type MapBoundsInput = z.infer<typeof MapBoundsSchema>;
export type UpdateAlertStatusInput = z.infer<typeof UpdateAlertStatus>;
export type AlertAssignmentInput = z.infer<typeof AlertAssignment>;
