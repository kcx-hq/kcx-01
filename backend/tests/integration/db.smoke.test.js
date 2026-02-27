import { Client } from "pg";
import { describe, expect, it } from "vitest";
import { loadTestEnv } from "../helpers/env.js";

function resolveSslOption() {
  if (process.env.DB_SSL === "true") {
    return {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }
  return false;
}

function buildConnectionConfig() {
  loadTestEnv();

  const hasConnectionString =
    typeof process.env.DATABASE_URL === "string" &&
    process.env.DATABASE_URL.trim() !== "";

  if (hasConnectionString) {
    const parsed = new URL(process.env.DATABASE_URL);
    const expectedHost = String(process.env.DB_HOST || "").trim();
    const expectedPort = String(process.env.DB_PORT || "").trim();

    if (expectedHost && parsed.hostname !== expectedHost) {
      throw new Error("Test suite is not connected to Docker database");
    }

    if (expectedPort && parsed.port !== expectedPort) {
      throw new Error("Test suite is not connected to Docker database");
    }

    return {
      connectionString: process.env.DATABASE_URL,
      ssl: resolveSslOption(),
    };
  }

  const host = String(process.env.DB_HOST || "").trim();
  const port = Number(process.env.DB_PORT || "5432");
  const user = String(process.env.DB_USER || "").trim();
  const password = String(process.env.DB_PASSWORD || "").trim();
  const database = String(process.env.DB_NAME || "").trim();

  if (!host || !Number.isInteger(port) || !user || !password || !database) {
    throw new Error(
      "Missing required DB connection env values. Expected DATABASE_URL or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME."
    );
  }

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: resolveSslOption(),
  };
}

async function withPgClient(callback) {
  const client = new Client(buildConnectionConfig());
  try {
    await client.connect();
    return await callback(client);
  } finally {
    await client.end();
  }
}

describe("database smoke connectivity", () => {
  it("connects and returns SELECT 1", async () => {
    await withPgClient(async (client) => {
      const result = await client.query("SELECT 1 as ok");
      expect(result.rows).toHaveLength(1);
      expect(Number(result.rows[0].ok)).toBe(1);
    });
  });

  it("returns active database identity", async () => {
    await withPgClient(async (client) => {
      const result = await client.query(
        "SELECT current_database() as db, inet_server_addr() as addr"
      );
      expect(result.rows).toHaveLength(1);
      expect(typeof result.rows[0].db).toBe("string");
      expect(result.rows[0].db.trim().length).toBeGreaterThan(0);
      expect(result.rows[0].addr).toBeDefined();
    });
  });

  it("returns server version and expected docker port", async () => {
    await withPgClient(async (client) => {
      const versionResult = await client.query(
        "SELECT current_setting('server_version') as version"
      );
      const portResult = await client.query("SELECT inet_server_port() as port");

      expect(versionResult.rows).toHaveLength(1);
      expect(typeof versionResult.rows[0].version).toBe("string");
      expect(versionResult.rows[0].version.trim().length).toBeGreaterThan(0);

      expect(portResult.rows).toHaveLength(1);
      const serverPort = Number(portResult.rows[0].port);
      expect(Number.isInteger(serverPort)).toBe(true);

      if (process.env.DB_PORT) {
        const expectedPort = Number(process.env.DB_PORT);
        if (serverPort !== expectedPort) {
          throw new Error("Test suite is not connected to Docker database");
        }
        expect(serverPort).toBe(expectedPort);
      }
    });
  });
});
