import { describe, test, expect } from "vitest";
import { AlertSchema, CameraSchema } from "./management";

const alertData = [
  {
    severity: 6,
    status: "open",
    location: {
      x: 32,
      y: 33,
    },
  },
  {
    severity: 0,
    status: "open",
    location: {
      x: 32,
      y: 33,
    },
  },
  {
    severity: 3,
    status: "open",
    location: {
      x: 32,
      y: 33,
    },
  },
  {
    severity: 3,
    status: "status",
    location: {
      x: 32,
      y: 33,
    },
  },
  {
    severity: 3,
    status: "open",
    location: {
      x: "x",
      y: 33,
    },
  },
  {
    severity: 3,
    status: "open",
    location: {
      x: 32,
      y: "y",
    },
  },
  {
    severity: 3,
    status: "open",
    location: {
      x: "x",
      y: "y",
    },
  },
  {
    severity: 3,
    status: "open",
    type: "Recognition",
    location: {
      x: 32,
      y: 33,
    },
  },
  {
    severity: 3,
    status: "open",
    type: 2,
    location: {
      x: 32,
      y: 33,
    },
  },
  {
    status: "open",
    location: { x: 32, y: 33 },
  },
  {
    severity: 3,
    status: "open",
  },
  {
    severity: 3,
    status: "open",
    type: null,
  },
];

const cameraData = [
  {
    name: "camera",
    status: "active",
    location: {
      x: 32,
      y: 33,
    },
    direction: 15,
  },
  {
    name: 3,
    status: "active",
    location: {
      x: 32,
      y: 33,
    },
    direction: 15,
  },
  {
    name: null,
    status: "active",
    location: {
      x: 32,
      y: 33,
    },
    direction: 15,
  },
  {
    name: "name",
    status: 2,
    location: {
      x: 32,
      y: 33,
    },
    direction: 15,
  },
  {
    name: "name",
    status: "status",
    location: {
      x: 32,
      y: 33,
    },
    direction: 15,
  },
  {
    name: "name",
    status: "fault",
    location: {
      x: 32,
      y: 33,
    },
    direction: 15,
  },
  // 6: Location fields invalid (x is string instead of number)
  {
    name: "camera",
    status: "active",
    location: { x: "invalid-x", y: 33 },
    direction: 15,
  },
  // 7: Direction is valid lower boundary (0)
  {
    name: "camera",
    status: "active",
    direction: 0,
  },
  // 8: Direction is valid upper boundary (360)
  {
    name: "camera",
    status: "active",
    direction: 360,
  },
  // 9: Direction is invalid (below 0)
  {
    name: "camera",
    status: "active",
    direction: -1,
  },
  // 10: Direction is invalid (above 360)
  {
    name: "camera",
    status: "active",
    direction: 361,
  },
  // 11: Missing required fields (missing name completely)
  {
    status: "active",
  },
];

describe("management zod schema", () => {
  describe("alert schema", () => {
    describe("check alert severity", () => {
      test("check alert severity more than 5", () => {
        const result = AlertSchema.safeParse(alertData[0]);

        expect(result.success).toBe(false);
      });

      test("check alert severity less than 1", () => {
        const result = AlertSchema.safeParse(alertData[1]);

        expect(result.success).toBe(false);
      });

      test("check valid severity", () => {
        const result = AlertSchema.safeParse(alertData[2]);

        expect(result.success).toBe(true);
      });
    });

    describe("check alert status", () => {
      test("check valid alert status (open or closed)", () => {
        const result = AlertSchema.safeParse(alertData[2]);

        expect(result.success).toBe(true);
      });

      test("check invalid alert status", () => {
        const result = AlertSchema.safeParse(alertData[3]);

        expect(result.success).toBe(false);
      });
    });

    describe("check location", () => {
      test("check x invalid", () => {
        const result = AlertSchema.safeParse(alertData[4]);

        expect(result.success).toBe(false);
      });

      test("check y invalid", () => {
        const result = AlertSchema.safeParse(alertData[5]);

        expect(result.success).toBe(false);
      });

      test("check x and y invalid", () => {
        const result = AlertSchema.safeParse(alertData[6]);

        expect(result.success).toBe(false);
      });

      test("check x and y valid", () => {
        const result = AlertSchema.safeParse(alertData[2]);

        expect(result.success).toBe(true);
      });
    });

    describe("check alert type", () => {
      test("check if type is a string", () => {
        const result = AlertSchema.safeParse(alertData[7]);

        expect(result.success).toBe(true);
      });

      test("check if type is not a string", () => {
        const result = AlertSchema.safeParse(alertData[8]);

        expect(result.success).toBe(false);
      });
    });

    describe("check optional and required fields", () => {
      test("fail if required fields are missing", () => {
        const result = AlertSchema.safeParse(alertData[9]);

        expect(result.success).toBe(false);
      });

      test("pass with only required fields", () => {
        const result = AlertSchema.safeParse(alertData[10]);

        expect(result.success).toBe(true);
      });

      test("fail optional field is null", () => {
        const result = AlertSchema.safeParse(alertData[11]);

        expect(result.success).toBe(false);
      });
    });
  });

  describe("camera schema", () => {
    describe("check camera name validity", () => {
      test("pass if name is a string", () => {
        const result = CameraSchema.safeParse(cameraData[0]);
        expect(result.success).toBe(true);
      });

      test("fail if name is not a string", () => {
        const result = CameraSchema.safeParse(cameraData[1]);
        expect(result.success).toBe(false);
      });

      test("check if name is not null", () => {
        const result = CameraSchema.safeParse(cameraData[2]);
        expect(result.success).toBe(false);
      });
    });

    describe("check camera status", () => {
      test("fail if status is not a string", () => {
        const result = CameraSchema.safeParse(cameraData[3]);
        expect(result.success).toBe(false);
      });

      test("fail if status is not valid (active, inactive, fault)", () => {
        const result = CameraSchema.safeParse(cameraData[4]);
        expect(result.success).toBe(false);
      });

      test("pass if status is valid", () => {
        const result = CameraSchema.safeParse(cameraData[5]);
        expect(result.success).toBe(true);
      });
    });

    describe("check camera location", () => {
      test("pass if location is omitted entirely (optional)", () => {
        // Index 7 does not have a location key passed
        const result = CameraSchema.safeParse(cameraData[7]);
        expect(result.success).toBe(true);
      });

      test("fail if inner location fields are invalid types", () => {
        const result = CameraSchema.safeParse(cameraData[6]);
        expect(result.success).toBe(false);
        expect(result.error?.format().location).toBeDefined();
      });
    });

    describe("check camera direction", () => {
      test("pass at minimum boundary (0)", () => {
        const result = CameraSchema.safeParse(cameraData[7]);
        expect(result.success).toBe(true);
      });

      test("pass at maximum boundary (360)", () => {
        const result = CameraSchema.safeParse(cameraData[8]);
        expect(result.success).toBe(true);
      });

      test("fail if direction is less than 0", () => {
        const result = CameraSchema.safeParse(cameraData[9]);
        expect(result.success).toBe(false);
        expect(result.error?.format()).toHaveProperty("direction");
      });

      test("fail if direction is more than 360", () => {
        const result = CameraSchema.safeParse(cameraData[10]);
        expect(result.success).toBe(false);
        expect(result.error?.format()).toHaveProperty("direction");
      });
    });

    describe("check missing required fields", () => {
      test("fail if required fields are absent", () => {
        const result = CameraSchema.safeParse(cameraData[11]);
        expect(result.success).toBe(false);
        expect(result.error?.format()).toHaveProperty("name");
      });
    });
  });
});
