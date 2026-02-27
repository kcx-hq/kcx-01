import { describe, expect, it } from "vitest";
import {
  extractUploadIdsBodyFirst,
  extractUploadIdsFromRequest,
  normalizeUploadIds,
} from "../../../src/modules/core-dashboard/utils/uploadIds.utils.js";

describe("core-dashboard uploadIds utils", () => {
  describe("normalizeUploadIds", () => {
    it.each([
      [["a", " b ", "", null], ["a", "b", "null"]],
      ["u1,u2 , u3", ["u1", "u2", "u3"]],
      ["single", ["single"]],
      [undefined, []],
      [123, []],
    ])("normalizes %p", (input, expected) => {
      expect(normalizeUploadIds(input)).toEqual(expected);
    });
  });

  it("extracts uploadIds from request with query precedence order", () => {
    const req = {
      query: {
        uploadid: "q1,q2",
        uploadIds: "q3",
      },
      body: {
        uploadIds: "b1,b2",
      },
    };

    expect(extractUploadIdsFromRequest(req)).toEqual(["q1", "q2"]);
  });

  it("falls back from query to body when query has no ids", () => {
    const req = {
      query: {},
      body: {
        uploadId: "b1",
      },
    };

    expect(extractUploadIdsFromRequest(req)).toEqual(["b1"]);
  });

  it("extractUploadIdsBodyFirst prefers body over query", () => {
    const req = {
      body: { uploadIds: "body-1,body-2" },
      query: { uploadIds: "query-1,query-2" },
    };

    expect(extractUploadIdsBodyFirst(req)).toEqual(["body-1", "body-2"]);
  });

  it("extractUploadIdsBodyFirst falls back to query", () => {
    const req = {
      body: {},
      query: { uploadId: "query-only" },
    };

    expect(extractUploadIdsBodyFirst(req)).toEqual(["query-only"]);
  });
});
