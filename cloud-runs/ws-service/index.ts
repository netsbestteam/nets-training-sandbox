import Elysia from "elysia";
import { connection } from "./src/connection";

export const app = new Elysia()
  .onError(({ error, code, set }) => {
    return {
      status: "error",
      type: "INTERNAL_SERVER_ERROR",
      details: error,
    };
  })
  .use(connection)
  .listen(3002);
