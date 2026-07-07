import { AckPolicy } from "nats";
import { js, jsm } from "./nats";
import { logger } from "../../../shared-backend/src/logger";

const STREAM_NAME = "EVENTS";
const CONSUMER_NAME = "alerts-consumer";
const SUBJECT = "events.alert.created";

export async function startConsumer() {
  // Create the durable consumer if it does not exist
  try {
    await jsm.consumers.info(STREAM_NAME, CONSUMER_NAME);
    logger.info("Durable consumer already exists");
  } catch {
    await jsm.consumers.add(STREAM_NAME, {
      durable_name: CONSUMER_NAME,
      ack_policy: AckPolicy.Explicit,
      filter_subject: SUBJECT,
    });

    logger.info("Created durable consumer");
  }

  const consumer = await js.consumers.get(STREAM_NAME, CONSUMER_NAME);

  logger.info("Starting alerts consumer");

  while (true) {
    const messages = await consumer.fetch({
      max_messages: 10,
      expires: 5000,
    });

    for await (const msg of messages) {
      try {
        const data = msg.json();

        logger.info("Received alert event:");
        logger.info(data);

        // TODO:
        // handle the alert event here

        msg.ack();
      } catch (err) {
        logger.info("Failed processing message " + err);
      }
    }
  }
}
