import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  geometry,
  numeric,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const cameraSchema = pgSchema("camera");

export const cameras = cameraSchema.table(
  "cameras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    camera_name: text().notNull(),
    status: text().notNull(),
    installationDate: timestamp("installation_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),
    direction: numeric(),
  },
  (table) => [
    check(
      "status_check",
      sql`${table.status} IN ('active', 'inactive', 'fault')`,
    ),
    check(
      "camera_check",
      sql`${table.direction} >= 0 AND ${table.direction} <= 360`,
    ),
  ],
);

export const alerts = cameraSchema.table(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    severity: numeric(),
    alert_type: text(),
    alert_time: timestamp().notNull().defaultNow(),
    status: text().notNull(),
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),
    camera_id: uuid("camera_id").references(() => cameras.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    check(
      "severity_check",
      sql`${table.severity} >= 1 AND ${table.severity} <= 5`,
    ),
    check("status_check", sql`${table.status} IN ('active', 'inactive')`),
  ],
);

export const investigators = cameraSchema.table("investigators", {
  id: uuid("id").primaryKey().defaultRandom(),
  full_name: text().notNull(),
  team: text(),
  isActive: boolean().notNull(),
});

export const alert_assignments = cameraSchema.table(
  "alert_assignments",
  {
    investigatorId: uuid("id").references(() => investigators.id, {
      onDelete: "restrict",
    }),
    alertId: uuid("alert_id").references(() => alerts.id, {
      onDelete: "cascade",
    }),
    assignment_start: timestamp("assignment_start", { withTimezone: true }),
    assignment_end: timestamp("assignment_end", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ name: "id", columns: [table.investigatorId, table.alertId] }),
  ],
);
