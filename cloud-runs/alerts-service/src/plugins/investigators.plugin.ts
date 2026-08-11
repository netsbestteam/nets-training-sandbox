import Elysia from "elysia";
import { logger } from "@shared-backend/logger";
import { db } from "@shared-backend/db";
import { alert_assignments, investigators } from "@shared-backend/db/schema";
import { eq } from "drizzle-orm";

export const investigatorRoutes = new Elysia({ prefix: "/investigators" })
  .get("/", async () => {
    try {
      logger.info("Getting investigators");
      return await db.select().from(investigators);
    } catch (e: unknown) {
      logger.error("Error getting investigators: " + e);
      throw e;
    }
  })
  .get("/:alertId/investigators", async ({ params }) => {
    try {
      logger.info(`getting investigators for alert ${params.alertId}`);

      const results = await db
        .select({
          investigator_id: investigators.investigator_id,
          full_name: investigators.full_name,
          team: investigators.team,
          is_active: investigators.is_active,
        })
        .from(alert_assignments)
        .innerJoin(
          investigators,
          eq(alert_assignments.investigator_id, investigators.investigator_id),
        )
        .where(eq(alert_assignments.alertId, params.alertId));

      logger.info(`investigators retrieved successfully`);
      return results;
    } catch (e: unknown) {
      logger.error(`Error getting ${params.alertId} investigators: ${e}`);
      throw e;
    }
  });
