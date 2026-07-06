import Elysia from "elysia";
import { logger } from "../../../../shared-backend/src/logger";

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
