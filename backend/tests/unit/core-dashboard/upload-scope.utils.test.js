import { describe, expect, it } from "vitest";
import { uniqueUploadIds } from "../../../src/modules/core-dashboard/utils/uploadScope.service.js";

describe("core-dashboard upload scope helpers", () => {
  it("normalizes and deduplicates upload ids while preserving order", () => {
    const scoped = uniqueUploadIds([
      "upload-1",
      " upload-2 ",
      "upload-1",
      "",
      null,
      "upload-3",
    ]);

    expect(scoped).toEqual(["upload-1", "upload-2", "null", "upload-3"]);
  });

  it("returns empty list for empty input", () => {
    expect(uniqueUploadIds(undefined)).toEqual([]);
  });
});
