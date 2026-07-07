import { logger } from "../../../shared-backend/src/logger";
import { streamManager } from "./nats.plugin";

export async function setupJetStream() {
  try {
    await streamManager.streams.delete("ALERTS");
    logger.info("Deleted ALERTS stream");
  } catch {
    logger.info("ALERTS stream did not exist");
  }

  await streamManager.streams.add({
    name: "ALERTS",
    subjects: ["alerts.>"],
  });

  logger.info("Created ALERTS stream");
}
