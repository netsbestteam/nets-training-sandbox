import Elysia, { t } from "elysia";
import {
  AlertAssignment,
  AlertSchema,
  UpdateAlertStatus,
} from "../../../../shared/src/schemas/management";
import { db } from "../../../../shared-backend/src/db";
import {
  alert_assignments,
  alerts,
} from "../../../../shared-backend/src/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../../../shared-backend/src/logger";
import { js } from "../../../dispatcher-service/nats/nats.plugin";
import { AlertEvents } from "../../../../shared/src/events";
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
    async ({ params, body }) => {
      try {
        logger.info(
          `Attempting POST bulk alert assignments for alert: ${params.id}`,
        );

        const assignmentRows = body.investigatorIds.map((id: string) => ({
          investigator_id: id,
          alert_id: params.id,
        }));

        if (assignmentRows.length === 0) {
          return { data: body };
        }

        await db.insert(alert_assignments).values(assignmentRows);

        // 3. Publish an event to jetstream for each assigned investigator
        const codec = JSONCodec();
        const publishPromises = body.investigatorIds.map((id: string) =>
          js.publish(
            AlertEvents.Assigned,
            codec.encode({
              investigatorId: id,
              alertId: params.id,
            }),
          ),
        );

        await Promise.all(publishPromises);

        return { data: body };
      } catch (e: unknown) {
        logger.error("Error POST bulk alert assignment: " + e);
        throw e;
      }
    },
    {
      body: AlertAssignment,
    },
  );
