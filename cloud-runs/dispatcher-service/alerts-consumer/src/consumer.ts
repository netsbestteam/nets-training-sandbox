import { AckPolicy, JSONCodec } from "nats";
import { logger } from "../../../../shared-backend/src/logger";
import { AlertEvents } from "../../../../shared/src/events";
import type { AlertInput } from "../../../../shared/src/schemas/management";
import { db } from "../../../../shared-backend/src/db";
import { alerts, cameras } from "../../../../shared-backend/src/db/schema";
import { eq, sql } from "drizzle-orm";
import { js, streamManager } from "../../nats/nats.plugin";

const STREAM_NAME = "ALERTS";
const CONSUMER_NAME = "alerts-consumer";

// Message that we consume from the channel
export interface Message {
  alertId: string;
  body: AlertInput;
}

export async function startConsumer() {
  // Check if consumer already exists
  try {
    await streamManager.consumers.info(STREAM_NAME, CONSUMER_NAME);
    logger.info("Durable consumer already exists");
  } catch {
    await streamManager.consumers.add(STREAM_NAME, {
      durable_name: CONSUMER_NAME,
      ack_policy: AckPolicy.Explicit,
      filter_subject: AlertEvents.New,
    });
    logger.info("Created durable consumer");
  }

  const consumer = await js.consumers.get(STREAM_NAME, CONSUMER_NAME);
  logger.info("Starting alerts consumer");

  const messages = await consumer.consume();
  const RADIUS_METERS = 1000000;

  for await (const msg of messages) {
    try {
      const data: Message = msg.json();
      logger.info(`Received alert event for ID: ${data.alertId}`);

      try {
        // Get nearest camera query
        const nearbyCameras = await db
          .select()
          .from(cameras)
          .where(
            sql`ST_DWithin(
              ST_SetSRID(ST_MakePoint(${data.body.location?.x}, ${data.body.location?.y}), 4326)::geography,
              ${cameras.location}::geography,
              ${RADIUS_METERS}
            )`,
          )
          .orderBy(
            sql`ST_Distance(
              ST_SetSRID(ST_MakePoint(${data.body.location?.x}, ${data.body.location?.y}), 4326)::geography,
              ${cameras.location}::geography
            )`,
          )
          .limit(1);

        const nearestCamera = nearbyCameras[0] || null;

        // Update the new alert with nearest camera
        await db
          .update(alerts)
          .set({ camera_id: nearestCamera?.camera_id })
          .where(eq(alerts.alert_id, data.alertId));

        // Publish nearest camera event
        await js.publish(
          AlertEvents.CamerasFound,
          JSONCodec().encode({
            alertId: data.alertId,
            nearbyCamera: nearestCamera,
          }),
        );

        msg.ack();
      } catch (processingErr) {
        logger.error(
          `Failed processing database spatial queries: ${processingErr}`,
        );
        msg.nak();
      }
    } catch (parseErr) {
      logger.error("Failed parsing message JSON structure: " + parseErr);
      msg.term();
    }
  }
}
