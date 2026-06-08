import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Pure-logic tests only (scoring). Node environment, no DOM.
// Alias mirrors tsconfig `paths` so `@/...` imports resolve in tests.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
