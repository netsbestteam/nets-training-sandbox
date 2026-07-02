import Elysia, { t } from "elysia";
import { AlertSchema } from "../../../../shared/src/schemas/management";
import { db } from "../../../../shared-backend/src/db";
import {
  alert_assignments,
  alerts,
} from "../../../../shared-backend/src/db/schema";
import { eq } from "drizzle-orm";

export const alertRoutes = new Elysia({ prefix: "/alerts" })
  .get("/", async () => {
    const result = await db.select().from(alerts);

    return result;
  })
  .post(
    "/",
    async ({ body }) => {
      await db.insert(alerts).values(body);

      return {
        received: body,
      };
    },
    { body: AlertSchema },
  )
  .patch(
    "/:id/status",
    async ({ params, body }) => {
      await db
        .update(alerts)
        .set({ status: body.status })
        .where(eq(alerts.alert_id, params.id));

      return { status: body.status };
    },
    {
      body: t.Object({
        status: t.String(),
      }),
    },
  )
  .post(
    "/:id/assign",
    async ({ params, body }) => {
      await db.insert(alert_assignments).values({
        investigatorId: body.investigatorId,
        alertId: params.id,
      });

      return { data: body };
    },
    {
      body: t.Object({
        investigatorId: t.String(),
      }),
    },
  );
