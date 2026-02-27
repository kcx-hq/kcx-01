import { expect } from "vitest";

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /tokenHash/i,
  /sequelize/i,
  /\bstack\b/i,
];

export function assertErrorContract(response, expected) {
  const { status, code, message } = expected;

  expect(response.status).toBe(status);
  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        code,
      }),
      requestId: expect.any(String),
    }),
  );

  if (message) {
    expect(response.body.error.message).toBe(message);
  } else {
    expect(typeof response.body.error.message).toBe("string");
    expect(response.body.error.message.length).toBeGreaterThan(0);
  }

  assertNoSensitiveLeak(response);
}

export function assertNoSensitiveLeak(response) {
  const serialized = JSON.stringify(response.body || {});
  for (const pattern of SENSITIVE_PATTERNS) {
    expect(serialized).not.toMatch(pattern);
  }
}
