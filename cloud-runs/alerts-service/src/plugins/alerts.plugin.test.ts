import { describe, test, expect, vi } from "vitest";
import { app } from "../index";

// mock jose library globally for this test file
vi.mock("jose", () => {
  return {
    createRemoteJWKSet: vi.fn(),
    jwtVerify: vi.fn(async (token: string) => {
      if (token === "valid-mock-token") {
        return {
          payload: { sub: "user-123", name: "Test User", roles: ["admin"] },
        };
      }
      throw new Error("Invalid token");
    }),
  };
});

// mock nats jetstream so we dont need a real running nats server
vi.mock("../../../dispatcher-service/nats/nats.plugin", () => ({
  js: {
    publish: vi.fn().mockResolvedValue({ sequence: 1 }),
  },
}));

// mock the db connection with support for chaining (.insert().values().returning())
vi.mock("../../../../shared-backend/src/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi
      .fn()
      .mockResolvedValue([{ alert_id: "1", severity: 3, status: "open" }]),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: "new-alert-uuid" }]),
    }),
  },
}));

describe("check alerts API with auth mocking", () => {
  describe("test GET endpoint", () => {
    test("GET /alerts - fail if authorization header is missing", async () => {
      const response = await app.handle(new Request("http://localhost/alerts"));

      expect(response.status).toBe(401);

      const body = (await response.json()) as { type: string; status: string };
      expect(body.type).toBe("UNAUTHORIZED");
    });

    test("GET /alerts - pass guard and return alerts when mock token is valid", async () => {
      const response = await app.handle(
        new Request("http://localhost/alerts", {
          headers: {
            Authorization: "Bearer valid-mock-token",
          },
        }),
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as Array<{
        alert_id: string;
        severity: number;
        status: string;
      }>;

      expect(Array.isArray(data)).toBe(true);
      expect(data[0]!.alert_id).toBe("1");
    });

    test("GET /alerts - return 401 if token is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/alerts", {
          headers: {
            Authorization: "Bearer auth-token",
          },
        }),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("test POST new alert endpoint", () => {
    const validAlertPayload = {
      severity: 3,
      status: "open",
      location: {
        x: 32,
        y: 33,
      },
    };

    test("POST /alerts - pass create new alert with valid data and auth token", async () => {
      const response = await app.handle(
        new Request("http://localhost/alerts", {
          method: "POST",
          headers: {
            Authorization: "Bearer valid-mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validAlertPayload),
        }),
      );

      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        alertId: string;
        received: typeof validAlertPayload;
      };

      expect(body.alertId).toBe("new-alert-uuid");
      expect(body.received.severity).toBe(3);
    });

    test("POST /alerts - fail with 400 when body input violates validation schema", async () => {
      const invalidAlertPayload = {
        ...validAlertPayload,
        severity: 9,
      };

      const response = await app.handle(
        new Request("http://localhost/alerts", {
          method: "POST",
          headers: {
            Authorization: "Bearer valid-mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invalidAlertPayload),
        }),
      );

      expect(response.status).toBe(400);
    });

    test("POST /alerts - fail with 401 if attempting to post without auth token", async () => {
      const response = await app.handle(
        new Request("http://localhost/alerts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validAlertPayload),
        }),
      );

      expect(response.status).toBe(401);
    });
  });
});
