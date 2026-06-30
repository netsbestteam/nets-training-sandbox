import Elysia from "elysia";
import { authGuard } from "./guards/auth.guard";

export const app = new Elysia()
  .use(authGuard)
  .onError(({ code, error }) => {
    return {
      status: "error",
      type: "INTERNAL_SERVER_ERROR",
      details: error,
    };
  })
  .listen(3001);
