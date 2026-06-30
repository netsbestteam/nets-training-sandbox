import Elysia from "elysia";
import { AlertSchema } from "../../shared/src/schemas/management";
import { db } from "../../shared-backend/src/db";
import { alerts } from "../../shared-backend/src/db/schema";

export const alertRoutes = new Elysia({ prefix: "/alerts" }).post(
  "/",
  async ({ body }) => {
    await db.insert(alerts).values(body);
    return {
      received: body,
    };
  },
  { body: AlertSchema },
);
