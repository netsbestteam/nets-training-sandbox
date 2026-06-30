import Elysia from "elysia";
import { AlertSchema } from "../../shared/src/schemas/management";

export const alertRoutes = new Elysia({ prefix: "/alerts" }).post(
  "/",
  ({ body }) => {
    return {
      received: body,
    };
  },
  { body: AlertSchema },
);
