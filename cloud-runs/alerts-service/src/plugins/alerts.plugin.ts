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
      const result = await db.select().from(alerts);

      return result;
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
        const id = await db
          .insert(alerts)
          .values(body)
          .returning({ id: alerts.alert_id });

        if (server) {
          server.publish("all-alerts", JSON.stringify({ data: body }));
          await js.publish(
            AlertEvents.New,
            JSONCodec().encode({ alertId: id[0]?.id, body }),
          );
        }

        return {
          received: body,
        };
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

        return { status: body.status };
      } catch (e: unknown) {
        logger.error("Error PATCH alert status: " + e);
        throw e;
      }
    },
    {
      body: UpdateAlertStatus,
    },
  )
  .post(
    "/:id/assign",
    async ({ params, body }) => {
      logger.info("Attempting POST new alert assignment...");

      try {
        await db.insert(alert_assignments).values({
          investigatorId: body.investigatorId,
          alertId: params.id,
        });

        return { data: body };
      } catch (e: unknown) {
        logger.error("Error POST new alert assignment: " + e);
        throw e;
      }
    },
    {
      body: AlertAssignment,
    },
  );
