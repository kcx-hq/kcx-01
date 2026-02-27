import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { startTestDbContainer, waitForTestDbReady } from "./docker.js";
import { loadTestEnv } from "./env.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const backendRoot = path.resolve(currentDir, "..", "..");

function getDockerCommand() {
  return process.platform === "win32" ? "docker.exe" : "docker";
}

function getVitestCliPath() {
  return path.resolve(backendRoot, "node_modules", "vitest", "vitest.mjs");
}

function runCommandAllowFailure(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? backendRoot,
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({ exitCode: 1, stdout, stderr, error });
    });

    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr, error: null });
    });
  });
}

function buildConnectionConfig() {
  const ssl =
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
      : false;

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl,
    };
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl,
  };
}

async function getDockerRuntimeDiagnostics() {
  const composeFile = process.env.TEST_DOCKER_COMPOSE_FILE || "docker-compose.test.yml";
  const serviceName = process.env.TEST_DB_SERVICE_NAME || "postgres_test";
  const output = {
    composeFile,
    serviceName,
    containerId: null,
    health: null,
    mappedPort: null,
    composePsStdout: null,
    composePsStderr: null,
  };

  const composePs = await runCommandAllowFailure(
    getDockerCommand(),
    ["compose", "-f", composeFile, "ps"],
    { cwd: backendRoot }
  );
  output.composePsStdout = composePs.stdout.trim();
  output.composePsStderr = composePs.stderr.trim();

  const containerIdResult = await runCommandAllowFailure(
    getDockerCommand(),
    ["compose", "-f", composeFile, "ps", "-q", serviceName],
    { cwd: backendRoot }
  );
  output.containerId = containerIdResult.stdout.trim() || null;

  if (output.containerId) {
    const internalPort = String(process.env.DB_PORT || "5432");
    const healthResult = await runCommandAllowFailure(getDockerCommand(), [
      "inspect",
      "-f",
      "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}",
      output.containerId,
    ]);
    output.health = healthResult.stdout.trim() || null;

    const portResult = await runCommandAllowFailure(getDockerCommand(), [
      "port",
      output.containerId,
      `${internalPort}/tcp`,
    ]);
    output.mappedPort = portResult.stdout.trim() || null;
  }

  return output;
}

async function getDbProbeDiagnostics() {
  const probe = {
    reachable: false,
    authFailure: false,
    result: null,
    errorCode: null,
    errorMessage: null,
  };

  const client = new Client(buildConnectionConfig());
  try {
    await client.connect();
    const result = await client.query("SELECT 1 AS ok");
    probe.reachable = true;
    probe.result = result.rows?.[0] ?? null;
  } catch (error) {
    const message = String(error?.message || "");
    probe.errorCode = error?.code ?? null;
    probe.errorMessage = message;
    probe.authFailure =
      error?.code === "28P01" || /password authentication failed/i.test(message);
  } finally {
    try {
      await client.end();
    } catch {
      // no-op
    }
  }

  return probe;
}

function collectEnvDiagnostics() {
  const required = [
    "NODE_ENV",
    "DATABASE_URL",
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "TEST_DOCKER_COMPOSE_FILE",
    "TEST_DB_SERVICE_NAME",
  ];

  const presence = Object.fromEntries(
    required.map((name) => [name, Boolean(process.env[name] && String(process.env[name]).trim())])
  );

  let parsedUrl = null;
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      parsedUrl = {
        host: url.hostname,
        port: url.port || "5432",
        database: url.pathname.replace(/^\//, ""),
      };
    } catch {
      parsedUrl = { invalid: true };
    }
  }

  return {
    presence,
    parsedDatabaseUrl: parsedUrl,
    expectedDockerTarget: {
      host: process.env.DB_HOST || null,
      port: process.env.DB_PORT || null,
      database: process.env.DB_NAME || null,
    },
  };
}

async function runSmokeTestOnly() {
  const args = [
    getVitestCliPath(),
    "run",
    "tests/integration/db.smoke.test.js",
    "--passWithNoTests",
    "--no-file-parallelism",
    "--maxWorkers=1",
    "--maxConcurrency=1",
  ];

  return runCommandAllowFailure(process.execPath, args, {
    cwd: backendRoot,
    env: {
      ...process.env,
      NODE_ENV: "test",
      TEST_SUITE: "integration",
    },
  });
}

async function main() {
  loadTestEnv();

  try {
    await startTestDbContainer();
    await waitForTestDbReady();
  } catch (error) {
    const diagnostics = {
      stage: "docker-startup",
      error: String(error?.message || error),
      env: collectEnvDiagnostics(),
      docker: await getDockerRuntimeDiagnostics(),
      dbProbe: await getDbProbeDiagnostics(),
    };
    process.stderr.write(`${JSON.stringify(diagnostics, null, 2)}\n`);
    process.exit(1);
  }

  const smoke = await runSmokeTestOnly();
  if (smoke.exitCode === 0) {
    process.stdout.write(smoke.stdout);
    process.exit(0);
  }

  const diagnostics = {
    stage: "smoke-test",
    error: "DB smoke test failed",
    vitestStdout: smoke.stdout,
    vitestStderr: smoke.stderr,
    env: collectEnvDiagnostics(),
    docker: await getDockerRuntimeDiagnostics(),
    dbProbe: await getDbProbeDiagnostics(),
  };

  process.stderr.write(`${JSON.stringify(diagnostics, null, 2)}\n`);
  process.exit(1);
}

await main();
