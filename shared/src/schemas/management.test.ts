import { describe, test, expect } from "vitest";
import { AlertSchema, CameraSchema } from "./management";

const validAlertBase = {
  severity: 3,
  status: "open" as const,
  location: {
    x: 32,
    y: 33,
  },
};

const validCameraBase = {
  name: "Main Entrance Camera",
  status: "active" as const,
  location: {
    x: 32,
    y: 33,
  },
  direction: 15,
};

describe("management zod schema", () => {
  describe("alert schema", () => {
    describe("check alert severity", () => {
      test("check alert severity more than 5", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          severity: 6,
        });
        expect(result.success).toBe(false);
      });

      test("check alert severity less than 1", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          severity: 0,
        });
        expect(result.success).toBe(false);
      });

      test("check valid severity", () => {
        const result = AlertSchema.safeParse(validAlertBase);
        expect(result.success).toBe(true);
      });
    });

    describe("check alert status", () => {
      test("check valid alert status (open or closed)", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          status: "closed",
        });
        expect(result.success).toBe(true);
      });

      test("check invalid alert status", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          status: "invalid-status",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("check location", () => {
      test("check x invalid", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          location: { x: "invalid-string", y: 33 },
        });
        expect(result.success).toBe(false);
      });

      test("check y invalid", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          location: { x: 32, y: "invalid-string" },
        });
        expect(result.success).toBe(false);
      });

      test("check x and y invalid", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          location: { x: "invalid", y: "invalid" },
        });
        expect(result.success).toBe(false);
      });
    });

    describe("check alert type", () => {
      test("check if type is a string", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          type: "Recognition",
        });
        expect(result.success).toBe(true);
      });

      test("check if type is not a string", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          type: 12345,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("check optional and required fields", () => {
      test("fail if required fields are missing", () => {
        const { severity, ...alertWithoutSeverity } = validAlertBase;

        const result = AlertSchema.safeParse(alertWithoutSeverity);
        expect(result.success).toBe(false);
      });

      test("pass with only required fields (omitting location & type)", () => {
        const result = AlertSchema.safeParse({
          severity: 3,
          status: "open",
        });
        expect(result.success).toBe(true);
      });

      test("fail if optional field is null explicitly", () => {
        const result = AlertSchema.safeParse({
          ...validAlertBase,
          type: null,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("camera schema", () => {
    describe("check camera name validity", () => {
      test("pass if name is a string", () => {
        const result = CameraSchema.safeParse(validCameraBase);
        expect(result.success).toBe(true);
      });

      test("fail if name is not a string", () => {
        const result = CameraSchema.safeParse({
          ...validCameraBase,
          name: 12345,
        });
        expect(result.success).toBe(false);
      });

      test("check if name is not null", () => {
        const result = CameraSchema.safeParse({
          ...validCameraBase,
          name: null,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("check camera status", () => {
      test("fail if status is not valid", () => {
        const result = CameraSchema.safeParse({
          ...validCameraBase,
          status: "something-random",
        });
        expect(result.success).toBe(false);
      });

      test("pass if status is valid (fault)", () => {
        const result = CameraSchema.safeParse({
          ...validCameraBase,
          status: "fault",
        });
        expect(result.success).toBe(true);
      });
    });

    describe("check camera location", () => {
      test("pass if location is omitted entirely (optional)", () => {
        const { location, ...cameraWithoutLocation } = validCameraBase;

        const result = CameraSchema.safeParse(cameraWithoutLocation);
        expect(result.success).toBe(true);
      });

      test("fail if inner location fields are invalid types", () => {
        const result = CameraSchema.safeParse({
          ...validCameraBase,
          location: { x: "invalid-coordinate", y: 33 },
        });
        expect(result.success).toBe(false);
        expect(result.error?.format().location).toBeDefined();
      });
    });

    describe("check camera direction", () => {
      test("pass at minimum boundary (0)", () => {
        const result = CameraSchema.safeParse({
          ...validCameraBase,
          direction: 0,
        });
        expect(result.success).toBe(true);
      });

      test("pass at maximum boundary (360)", () => {
        const result = CameraSchema.safeParse({
          ...validCameraBase,
          direction: 360,
        });
        expect(result.success).toBe(true);
      });

      test("fail if direction is less than 0", () => {
        const result = CameraSchema.safeParse({
          ...validCameraBase,
          direction: -1,
        });
        expect(result.success).toBe(false);
        expect(result.error?.format()).toHaveProperty("direction");
      });

      test("fail if direction is more than 360", () => {
        const result = CameraSchema.safeParse({
          ...validCameraBase,
          direction: 361,
        });
        expect(result.success).toBe(false);
        expect(result.error?.format()).toHaveProperty("direction");
      });
    });

    describe("check missing required fields", () => {
      test("fail if required fields are absent", () => {
        const result = CameraSchema.safeParse({
          status: "active",
        });
        expect(result.success).toBe(false);
        expect(result.error?.format()).toHaveProperty("name");
      });
    });
  });
});
