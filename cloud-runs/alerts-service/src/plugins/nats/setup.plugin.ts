import { logger } from "../../../../../shared-backend/src/logger";
import { streamManager } from "./nats.plugin";

export async function setupJetStream() {
  try {
    await streamManager.streams.delete("EVENTS");
    logger.info("Deleted EVENTS stream");
  } catch {
    logger.info("EVENTS stream did not exist");
  }

  await streamManager.streams.add({
    name: "EVENTS",
    subjects: ["events.>"],
  });

  logger.info("Created EVENTS stream");
}
