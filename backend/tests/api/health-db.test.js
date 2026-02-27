import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { connectDb } from "../helpers/db.js";
import { createHttpClient } from "../helpers/http.js";

describe("GET /readyz with database interaction", () => {
  it("returns 200 and confirms DB insert/select path", async () => {
    let dbInteractionConfirmed = false;

    const app = createApp({
      readiness: async () => {
        const sequelize = await connectDb();
        const marker = `readyz-${Date.now()}`;

        await sequelize.query(
          "CREATE TEMP TABLE IF NOT EXISTS __readyz_probe (id BIGSERIAL PRIMARY KEY, marker TEXT NOT NULL);"
        );
        await sequelize.query("INSERT INTO __readyz_probe (marker) VALUES ($1);", {
          bind: [marker],
        });
        const [rows] = await sequelize.query(
          "SELECT COUNT(*)::int AS count FROM __readyz_probe WHERE marker = $1;",
          {
            bind: [marker],
          }
        );

        dbInteractionConfirmed = Number(rows?.[0]?.count) === 1;

        return dbInteractionConfirmed
          ? { ready: true }
          : {
              ready: false,
              error: new Error("Readiness DB probe failed"),
            };
      },
    });

    const client = createHttpClient(app);
    const response = await client.get("/readyz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
      })
    );
    expect(response.body.data).toEqual(
      expect.objectContaining({
        status: "ready",
      })
    );
    expect(dbInteractionConfirmed).toBe(true);
  });
});
