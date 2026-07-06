import Elysia from "elysia";
import { authGuard } from "./guards/auth.guard";
import { alertRoutes } from "./plugins/alerts.plugin";
import { UnauthorizedError } from "./errors/errors";
import { connection } from "./plugins/connection.plugin";

export const app = new Elysia()
  .use(authGuard)
  .error({ UnauthorizedError })
  .onError(({ code, error, set }) => {
    if (code == "UnauthorizedError") {
      set.status = 401;

      return {
        status: "error",
        type: "UNAUTHORIZED",
        details: error.message,
      };
    }

    return {
      status: "error",
      type: "INTERNAL_SERVER_ERROR",
      details: error,
    };
  })
  .use(connection)
  .use(alertRoutes)
  .listen(3001);

console.log(
  app.routes.map((r) => ({
    method: r.method,
    path: r.path,
  })),
);
