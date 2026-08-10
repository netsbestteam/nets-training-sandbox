import Elysia, { t } from "elysia";
import {
  AlertAssignment,
  AlertSchema,
  UpdateAlertStatus,
} from "@shared/schemas/management";
import { db } from "@shared-backend/db";
import {
  alert_assignments,
  alerts,
  investigators,
} from "@shared-backend/db/schema";
import { eq, inArray } from "drizzle-orm";
import { logger } from "@shared-backend/logger";
import { js } from "@cloud-runs/dispatcher-service/nats/nats.plugin";
import { AlertEvents } from "@shared/events";
import { JSONCodec } from "nats";

export const alertRoutes = new Elysia({ prefix: "/alerts" })
  .get("/", async () => {
    try {
      logger.info("Getting alerts");
      return await db.select().from(alerts);
    } catch (e: unknown) {
      logger.error("Error getting alerts: " + e);
      throw e;
    }
  })
  .post(
    "/",
    async ({ body, server }) => {
      try {
        logger.info("Attempting POST new alert");

        const inserted = await db
          .insert(alerts)
          .values(body)
          .returning({ id: alerts.alert_id });

        // Retreive alert id if inserted successfully
        const newAlertId = inserted[0]?.id;
        if (!newAlertId) {
          throw new Error("Failed to insert alert into database");
        }

        if (server) {
          const insertedAlert = await db
            .select()
            .from(alerts)
            .where(eq(alerts.alert_id, newAlertId));
          server.publish("all-alerts", JSON.stringify({ data: insertedAlert }));

          // Publish to jetstream
          await js.publish(
            AlertEvents.New,
            JSONCodec().encode({ alertId: newAlertId, body }),
          );
        }

        return { received: body, alertId: newAlertId };
      } catch (e: unknown) {
        logger.error("Error POST new alert: " + e);
        throw e;
      }
    },
    { body: AlertSchema },
  )
  .patch(
    "/:id/status",
    async ({ params, body }) => {
      try {
        logger.info("Attempting PATCH alert status...");

        await db
          .update(alerts)
          .set({ status: body.status })
          .where(eq(alerts.alert_id, params.id));

        logger.info("PATCH alert status successfull.");
        return { status: body.status };
      } catch (e: unknown) {
        logger.error("Error PATCH alert status: " + e);
        throw e;
      }
    },
    { body: UpdateAlertStatus },
  )

  .post(
    "/:id/assign",
    async ({ params, body, server }) => {
      try {
        logger.info(
          `Attempting POST alert assignment for alert ID: ${params.id}`,
        );

        const [alertRecord] = await db
          .select()
          .from(alerts)
          .where(eq(alerts.alert_id, params.id));

        if (!alertRecord) {
          return { error: "Alert not found" };
        }

        const investigatorIds: string[] = body.investigatorIds ?? [];

        await db
          .delete(alert_assignments)
          .where(eq(alert_assignments.alertId, params.id));

        if (investigatorIds.length > 0) {
          const assignmentsToInsert = investigatorIds.map((id) => ({
            investigator_id: id,
            alertId: params.id,
          }));

          await db.insert(alert_assignments).values(assignmentsToInsert);

          const assignedInvestigators = await db
            .select({
              id: investigators.investigator_id,
              keycloakId: investigators.keycloakId,
            })
            .from(investigators)
            .where(inArray(investigators.investigator_id, investigatorIds));

          for (const investigator of assignedInvestigators) {
            const targetKeycloakId =
              investigator.keycloakId ?? String(investigator.id);

            const payload = {
              event: AlertEvents.Assigned,
              payload: {
                investigatorId: targetKeycloakId,
                alertId: params.id,
                alertType: alertRecord.alert_type ?? alertRecord.alert_id,
                location: alertRecord.location,
              },
            };

            await js.publish(
              AlertEvents.Assigned,
              JSONCodec().encode(payload.payload),
            );

            server?.publish("alerts", JSON.stringify(payload));
          }
        }

        return { success: true, count: investigatorIds.length };
      } catch (e: unknown) {
        logger.error("Error POST bulk alert assignment: " + e);
        throw e;
      }
    },
    {
      body: AlertAssignment,
    },
  );
