import Elysia from "elysia";
import { authGuard } from "./guards/auth.guard";
import { alertRoutes } from "../../plugins/alerts.plugin";

export const app = new Elysia()
  .use(authGuard)
  .onError(({ code, error }) => {
    return {
      status: "error",
      type: "INTERNAL_SERVER_ERROR",
      details: error,
    };
  })
  .use(alertRoutes)
  .listen(3001);
