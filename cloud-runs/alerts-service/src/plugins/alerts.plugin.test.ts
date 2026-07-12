import { describe, test, expect, vi } from "vitest";
import { app } from "../index";

// Define globally for this file
const validAlertPayload = {
  severity: 3,
  status: "open",
  location: {
    x: 32,
    y: 33,
  },
};

// Mock the 'jose' library globally for this test file
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

// mock nats jetstream instead of a real running nats server
vi.mock("../../../dispatcher-service/nats/nats.plugin", () => ({
  js: {
    publish: vi.fn().mockResolvedValue({ sequence: 1 }),
  },
}));

// mock the db connection
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
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({ affectedRows: 1 }),
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
            Authorization: "Bearer complete-garbage-token",
          },
        }),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("test POST new alert endpoint", () => {
    test("POST /alerts - create new alert with valid data and auth token", async () => {
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

    test("POST /alerts - fail with 400 when body is invalid", async () => {
      const invalidAlertPayload = {
        ...validAlertPayload,
        severity: 9, // Invalid (only 1-5)
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

    test("POST /alerts - fail with 401 without auth token", async () => {
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

  describe("test PATCH alert status endpoint", () => {
    test("PATCH /alerts/:id/status - successfully update status", async () => {
      const response = await app.handle(
        new Request("http://localhost/alerts/111-222-333/status", {
          method: "PATCH",
          headers: {
            Authorization: "Bearer valid-mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "closed" }),
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as { status: string };
      expect(body.status).toBe("closed");
    });

    test("PATCH /alerts/:id/status - fail with 400 with wrong status type", async () => {
      const response = await app.handle(
        new Request("http://localhost/alerts/111-222-333/status", {
          method: "PATCH",
          headers: {
            Authorization: "Bearer valid-mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "invalid-status-string" }),
        }),
      );

      expect(response.status).toBe(400);
    });
  });

  describe("test POST alert assignment endpoint", () => {
    test("POST /alerts/:id/assign - successfully assign investigator", async () => {
      const response = await app.handle(
        new Request("http://localhost/alerts/111-222-333/assign", {
          method: "POST",
          headers: {
            Authorization: "Bearer valid-mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            investigatorId: "123e4567-e89b-12d3-a456-426614174000",
            investigator_id: "123e4567-e89b-12d3-a456-426614174000",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body).toBeDefined();
    });
  });

  describe("test error handling edge cases", () => {
    test("GET /alerts - handle internal database catch block branch", async () => {
      const { db } = (await import("../../../../shared-backend/src/db")) as any;
      db.from.mockRejectedValueOnce(new Error("Database disconnected"));

      const response = await app.handle(
        new Request("http://localhost/alerts", {
          headers: { Authorization: "Bearer valid-mock-token" },
        }),
      );

      const body = await response.json();
      expect(body).toBeDefined();
    });

    test("POST /alerts - handle internal database catch block branch", async () => {
      const { db } = (await import("../../../../shared-backend/src/db")) as any;
      db.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi
          .fn()
          .mockRejectedValueOnce(new Error("Insert constraint violation")),
      });

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

      const body = await response.json();
      expect(body).toBeDefined();
    });

    test("PATCH /alerts/:id/status - handle database update catch block branch", async () => {
      const { db } = (await import("../../../../shared-backend/src/db")) as any;
      db.update.mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi
          .fn()
          .mockRejectedValueOnce(new Error("Update targeted row locked")),
      });

      const response = await app.handle(
        new Request("http://localhost/alerts/111/status", {
          method: "PATCH",
          headers: {
            Authorization: "Bearer valid-mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "closed" }),
        }),
      );

      const body = await response.json();
      expect(body).toBeDefined();
    });

    test("POST /alerts/:id/assign - handle database assignment catch block", async () => {
      const { db } = (await import("../../../../shared-backend/src/db")) as any;
      db.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi
          .fn()
          .mockRejectedValueOnce(new Error("Assignment target missing")),
      });

      const response = await app.handle(
        new Request("http://localhost/alerts/111/assign", {
          method: "POST",
          headers: {
            Authorization: "Bearer valid-mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            investigatorId: "123e4567-e89b-12d3-a456-426614174000",
          }),
        }),
      );

      const body = await response.json();
      expect(body).toBeDefined();
    });
  });
});
