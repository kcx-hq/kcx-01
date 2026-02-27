import { describe, expect, it } from "vitest";
import { assertSafeDatabaseUrl } from "../helpers/env.js";

describe("env helper", () => {
  it("rejects production-like database targets", () => {
    expect(() =>
      assertSafeDatabaseUrl("postgres://postgres:postgres@localhost:5432/master01_production")
    ).toThrow(/unsafe/i);
  });
});
