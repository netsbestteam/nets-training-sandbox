import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Allows using 'describe', 'it', 'expect' without explicitly importing them in every test file
    globals: true,

    // Uses the lightweight node environment (perfect for Elysia API testing)
    environment: "node",

    // Optional: Sets up coverage reporting configurations if you want to track code coverage later
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/"],
    },

    // Maps your project's custom path aliases so Vitest can find your shared layers
    alias: {
      "@shared": path.resolve(__dirname, "./shared/src"),
      "@shared-backend": path.resolve(__dirname, "./shared-backend/src"),
      "@cloud-runs": path.resolve(__dirname, "./cloud-runs"),
    },
  },
});
