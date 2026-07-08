import Elysia from "elysia";
import { startConsumer } from "./consumer";
import { logger } from "../../../../shared-backend/src/logger";

await startConsumer();

new Elysia().listen(process.env.ALERT_CONSUMER_PORT!);

logger.info(
  `Alerts consumer running on port ${process.env.ALERT_CONSUMER_PORT}`,
);
