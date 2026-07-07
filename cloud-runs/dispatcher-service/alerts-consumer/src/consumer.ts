import { AckPolicy, JSONCodec } from "nats";
import { js, jsm } from "./nats";
import { logger } from "../../../../shared-backend/src/logger";
import { AlertEvents } from "../../../../shared/src/events";
import type { AlertInput } from "../../../../shared/src/schemas/management";
import { db } from "../../../../shared-backend/src/db";
import { alerts, cameras } from "../../../../shared-backend/src/db/schema";
import { eq, sql } from "drizzle-orm";

const STREAM_NAME = "ALERTS";
const CONSUMER_NAME = "alerts-consumer";

export interface Message {
  alertId: string;
  body: AlertInput;
}

export async function startConsumer() {
  try {
    await jsm.consumers.info(STREAM_NAME, CONSUMER_NAME);
    logger.info("Durable consumer already exists");
  } catch {
    await jsm.consumers.add(STREAM_NAME, {
      durable_name: CONSUMER_NAME,
      ack_policy: AckPolicy.Explicit,
      filter_subject: AlertEvents.New,
    });

    logger.info("Created durable consumer");
  }

  const consumer = await js.consumers.get(STREAM_NAME, CONSUMER_NAME);

  logger.info("Starting alerts consumer");

  const messages = await consumer.consume();

  const RADIUS = 1000000;

  for await (const msg of messages) {
    try {
      const data: Message = msg.json();
      logger.info("Received alert event:");
      logger.info(JSON.stringify(data));

      try {
        const nearbyCameras = await db
          .select()
          .from(cameras)
          .where(
            sql`ST_DWithin(
              ST_SetSRID(ST_MakePoint(${data.body.location?.x}, ${data.body.location?.y}), 4326),
              ${cameras.location},
              ${RADIUS}
            )`,
          )
          // Order by the calculated distance between the alert point and the camera
          .orderBy(
            sql`ST_Distance(
              ST_SetSRID(ST_MakePoint(${data.body.location?.x}, ${data.body.location?.y}), 4326),
              ${cameras.location}
            )`,
          )
          .limit(1);

        const nearestCamera = nearbyCameras[0] || null;

        await db
          .update(alerts)
          .set({ camera_id: nearestCamera?.camera_id })
          .where(eq(alerts.alert_id, data.alertId));

        await js.publish(
          AlertEvents.CamerasFound,
          JSONCodec().encode({
            alertId: data.alertId,
            nearbyCamera: nearestCamera,
          }),
        );
        //console.log("alertId: " + data.alertId);
        //console.log(nearbyCameras);
        console.log(nearestCamera);
      } catch (e: unknown) {
        logger.error(e);
      }

      msg.ack();
    } catch (err) {
      logger.error("Failed processing message " + err);
    }
  }
}
