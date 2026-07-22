import Elysia from "elysia";
import { authGuard } from "./guards/auth.guard";
import { alertRoutes } from "./plugins/alerts.plugin";
import { UnauthorizedError } from "./errors/errors";
import {
  connection,
  startWebSocketConsumer,
} from "./plugins/connection.plugin";
import { logger } from "../../../shared-backend/src/logger";
import { setupJetStream } from "../../dispatcher-service/nats/setup.plugin";
import cors from "@elysiajs/cors";
import { investigatorRoutes } from "./plugins/investigators.plugin";

await setupJetStream();

export const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(authGuard)
  .error({ UnauthorizedError })
  .onError(({ code, error, set }) => {
    if (code === "UnauthorizedError") {
      logger.error("Unauthorized access");
      set.status = 401;
      return {
        status: "error",
        type: "UNAUTHORIZED",
        details: error.message,
      };
    }

    if (code === "VALIDATION") {
      logger.error("Validation Error: " + error.message);
      set.status = 400;
      return {
        status: "error",
        type: "VALIDATION_ERROR",
        details: error.message,
      };
    }

    logger.error("Error: " + error);
    set.status = 500;
    return {
      status: "error",
      type: "INTERNAL_SERVER_ERROR",
      details: error,
    };
  })
  .use(connection)
  .use(alertRoutes)
  .use(investigatorRoutes)
  .listen(process.env.ALERT_SERVICE_PORT!);

await startWebSocketConsumer(app.server);
