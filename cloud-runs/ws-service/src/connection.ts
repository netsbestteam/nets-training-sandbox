import Elysia from "elysia";
import { logger } from "../../../shared-backend/src/logger";

export const connection = new Elysia().ws("/socket", {
  idleTimeout: 30,
  open(ws) {
    logger.info("Connection opened");
  },
  ping(message) {
    logger.info("Received ping: " + message);
  },
  pong(message) {
    logger.info("Received pong: " + message);
  },
  message(ws, message) {
    console.log("Message:", message);
  },
});
