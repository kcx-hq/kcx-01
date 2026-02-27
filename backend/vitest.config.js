import { defineConfig } from "vitest/config";

const testSuite = process.env.TEST_SUITE;
const isUnitLikeSuite = testSuite === "unit" || testSuite === "component";
const setupFiles = ["./tests/setup.js"];

if (testSuite === "component") {
  setupFiles.push("./tests/component/setup.js");
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    globalSetup: isUnitLikeSuite ? [] : ["./tests/globalSetup.js"],
    setupFiles,
    testTimeout: 5000,
    hookTimeout: 60000,
    pool: "forks",
    fileParallelism: isUnitLikeSuite,
    maxConcurrency: isUnitLikeSuite ? 10 : 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      reportsDirectory: "./coverage",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "tests/helpers/**",
        "tests/fixtures/**",
      ],
    },
  },
});
