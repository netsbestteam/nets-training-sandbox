import type Elysia from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { UnauthorizedError } from "../errors/errors";

const JWKS = createRemoteJWKSet(
  new URL(
    `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM_NAME}/protocol/openid-connect/certs`,
  ),
);

export const authGuard = (app: Elysia) =>
  app.derive(async ({ headers, query }) => {
    let token: string | undefined;

    const authHeader = headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && typeof query?.token === "string") {
      token = query.token;
    }

    if (!token) {
      throw new UnauthorizedError("Missing authorization token");
    }

    try {
      const { payload } = await jwtVerify(token, JWKS);

      const expectedRealm = `/realms/${process.env.KEYCLOAK_REALM_NAME}`;
      if (!payload.iss || !payload.iss.endsWith(expectedRealm)) {
        throw new UnauthorizedError("Invalid token issuer");
      }

      return { user: payload };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError("Invalid or expired token");
    }
  });
