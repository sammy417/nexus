import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the calculation layer (`src/lib/services`, `src/lib/models`).
 *
 * Everything under test is a pure function — no DOM, no database, no network —
 * so the default `node` environment is enough and no mocking is required.
 * Components and the server-only modules (quote/news/backup services) are
 * deliberately out of scope: they're thin wrappers around these functions or
 * around I/O that the manual/Playwright checks already cover.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
