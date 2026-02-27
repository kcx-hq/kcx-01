import express from "express";
import { describe, expect, it } from "vitest";
import { createBearerAuthHeader, createHttpClient } from "../helpers/http.js";

describe("api helper behavior", () => {
  it("sends bearer authorization headers", async () => {
    const app = express();
    app.get("/secure", (req, res) => {
      res.status(200).json({
        authorization: req.headers.authorization ?? null,
      });
    });

    const client = createHttpClient(app);
    const response = await client.get("/secure", {
      headers: createBearerAuthHeader("token-123"),
    });

    expect(response.status).toBe(200);
    expect(response.body.authorization).toBe("Bearer token-123");
  });
});
