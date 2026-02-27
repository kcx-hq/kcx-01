import { expect } from "vitest";

let isRegistered = false;

const customMatchers = {
  toBeIsoDateString(received) {
    const pass =
      typeof received === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(received) &&
      !Number.isNaN(Date.parse(received));

    return {
      pass,
      message: () =>
        pass
          ? `Expected "${received}" not to be a valid ISO-8601 UTC datetime string`
          : `Expected "${received}" to be a valid ISO-8601 UTC datetime string`,
    };
  },

  toHaveHttpStatus(received, expectedStatus) {
    const actualStatus = received?.status;
    const pass = actualStatus === expectedStatus;

    return {
      pass,
      message: () =>
        pass
          ? `Expected response status not to be ${expectedStatus}`
          : `Expected response status ${expectedStatus}, received ${actualStatus}`,
    };
  },
};

export function registerCustomMatchers() {
  if (isRegistered) {
    return;
  }

  expect.extend(customMatchers);
  isRegistered = true;
}
