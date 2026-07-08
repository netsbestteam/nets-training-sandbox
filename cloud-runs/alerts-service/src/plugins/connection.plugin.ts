import Elysia from "elysia";
import { logger } from "../../../../shared-backend/src/logger";
import { AckPolicy, JSONCodec } from "nats";
import { AlertEvents } from "../../../../shared/src/events";
import {
  js,
  streamManager,
} from "../../../dispatcher-service/nats/nats.plugin";
import type { Server } from "bun";

const STREAM_NAME = "ALERTS";
const WS_CONSUMER_NAME = "alerts-ws-consumer";

export const connection = new Elysia().ws("/socket", {
  open(ws) {
    ws.subscribe("all-alerts");
    logger.info("Connection opened");
  },

  close() {
    logger.info("Connection closed");
  },

  message(ws, message) {
    logger.info(`Message: ${message}`);
  },
});

export async function startWebSocketConsumer(server: Server<any> | null) {
  // Check if consumer already exists
  try {
    await streamManager.consumers.info(STREAM_NAME, WS_CONSUMER_NAME);
    logger.info("WS Durable consumer already exists");
  } catch {
    await streamManager.consumers.add(STREAM_NAME, {
      durable_name: WS_CONSUMER_NAME,
      ack_policy: AckPolicy.Explicit,
      filter_subjects: [AlertEvents.Assigned, AlertEvents.CamerasFound],
    });
    logger.info("Created WS durable consumer");
  }

  const consumer = await js.consumers.get(STREAM_NAME, WS_CONSUMER_NAME);
  const messages = await consumer.consume(); // Consume messages
  const sc = JSONCodec();

  // Async block for processing messages
  (async () => {
    logger.info("Starting nats websocket connection");
    for await (const msg of messages) {
      try {
        const subject = msg.subject;
        const payload = sc.decode(msg.data);

        logger.info(`broadcasting NATS event ${subject} over ws 'all-alerts'`);

        server?.publish(
          "all-alerts",
          JSON.stringify({
            event: subject,
            data: payload,
          }),
        );

        msg.ack();
      } catch (err) {
        logger.error("Error processing event: " + err);
        msg.nak();
      }
    }
  })();
}
