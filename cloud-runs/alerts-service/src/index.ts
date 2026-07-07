import Elysia from "elysia";
import { authGuard } from "./guards/auth.guard";
import { alertRoutes } from "./plugins/alerts.plugin";
import { UnauthorizedError } from "./errors/errors";
import { connection } from "./plugins/connection.plugin";
import { logger } from "../../../shared-backend/src/logger";
import { setupJetStream } from "./plugins/nats/setup.plugin";

await setupJetStream();

export const app = new Elysia()
  .use(authGuard)
  .error({ UnauthorizedError })
  .onError(({ code, error, set }) => {
    if (code == "UnauthorizedError") {
      logger.error("Unauthorized access");
      set.status = 401;

      return {
        status: "error",
        type: "UNAUTHORIZED",
        details: error.message,
      };
    }

    logger.error("Error: " + error);
    return {
      status: "error",
      type: "INTERNAL_SERVER_ERROR",
      details: error,
    };
  })
  .use(connection)
  .use(alertRoutes)
  .listen(process.env.ALERT_SERVICE_PORT!);
