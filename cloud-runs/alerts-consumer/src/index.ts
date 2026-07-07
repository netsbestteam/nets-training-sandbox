import Elysia from "elysia";
import { startConsumer } from "./consumer";
import { logger } from "../../../shared-backend/src/logger";

await startConsumer();

new Elysia().listen(3002);

logger.info("Alerts consumer running on port 3002");
