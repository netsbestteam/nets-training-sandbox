import type Elysia from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(
    `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM_NAME}/protocol/openid-connect/certs`,
  ),
);

export const authGuard = (app: Elysia) =>
  app.onBeforeHandle(async ({ headers }) => {
    const authHeader = headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    // continue
    const token = authHeader.split(" ")[1]!;

    try {
      // Verify token signature against Keycloak JWKS
      const { payload } = await jwtVerify(token, JWKS);
      return { user: payload };
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  });
