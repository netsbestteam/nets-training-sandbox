import { logger } from "../../../../../shared-backend/src/logger";
import { streamManager } from "./nats.plugin";

export async function setupJetStream() {
  try {
    await streamManager.streams.info("EVENTS");
    logger.info("Stream already exists");
  } catch {
    await streamManager.streams.add({
      name: "EVENTS",
      subjects: ["events.*"],
    });

    logger.info("Created EVENTS stream");
  }
}
