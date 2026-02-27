import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadTestEnv } from "./env.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const backendRoot = path.resolve(currentDir, "..", "..");
const repositoryRoot = path.resolve(backendRoot, "..");

const composeCandidates = [
  "docker-compose.test.yml",
  "docker-compose.test.yaml",
  "docker-compose.yml",
  "docker-compose.yaml",
  "compose.test.yml",
  "compose.test.yaml",
  "compose.yml",
  "compose.yaml",
];

const state = {
  started: false,
  startedByLifecycle: false,
  composeFile: null,
  serviceName: null,
  startPromise: null,
  stopPromise: null,
  cleanupRegistered: false,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDbAutoManageEnabled() {
  return process.env.TEST_DB_AUTO_MANAGE === "true";
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
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
      reject(new Error(`Failed to execute command: ${command} ${args.join(" ")}`, { cause: error }));
    });

    child.on("close", (exitCode) => {
      if (exitCode === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `Command failed with exit code ${exitCode}: ${command} ${args.join(
            " "
          )}\n${stderr || stdout}`
        )
      );
    });
  });
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

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveComposeFile(explicitPath) {
  if (explicitPath) {
    const absolutePath = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(backendRoot, explicitPath);

    if (await fileExists(absolutePath)) {
      return absolutePath;
    }

    throw new Error(`Docker compose file not found: ${absolutePath}`);
  }

  const envPath = process.env.TEST_DOCKER_COMPOSE_FILE;
  if (envPath) {
    const absolutePath = path.isAbsolute(envPath) ? envPath : path.resolve(backendRoot, envPath);
    if (await fileExists(absolutePath)) {
      return absolutePath;
    }
    throw new Error(`TEST_DOCKER_COMPOSE_FILE not found: ${absolutePath}`);
  }

  for (const candidate of composeCandidates) {
    const localCandidate = path.resolve(backendRoot, candidate);
    if (await fileExists(localCandidate)) {
      return localCandidate;
    }

    const rootCandidate = path.resolve(repositoryRoot, candidate);
    if (await fileExists(rootCandidate)) {
      return rootCandidate;
    }
  }

  return null;
}

function getDockerCommand() {
  return process.platform === "win32" ? "docker.exe" : "docker";
}

async function resolveServiceName(options = {}) {
  const explicitService = options.serviceName ?? process.env.TEST_DB_SERVICE_NAME;
  if (explicitService) {
    return explicitService;
  }

  throw new Error("TEST_DB_SERVICE_NAME is required to manage the Docker test database.");
}

async function getContainerId(composeFile, serviceName) {
  const output = await runCommandAllowFailure(
    getDockerCommand(),
    ["compose", "-f", composeFile, "ps", "-q", serviceName],
    { cwd: path.dirname(composeFile) }
  );

  if (output.exitCode !== 0) {
    return "";
  }

  return output.stdout.trim();
}

async function isServiceRunning(composeFile, serviceName) {
  const containerId = await getContainerId(composeFile, serviceName);
  if (!containerId) {
    return false;
  }

  const inspect = await runCommandAllowFailure(getDockerCommand(), [
    "inspect",
    "-f",
    "{{.State.Running}}",
    containerId,
  ]);

  if (inspect.exitCode !== 0) {
    return false;
  }

  return inspect.stdout.trim() === "true";
}

async function getContainerHealthStatus(containerId) {
  const inspect = await runCommandAllowFailure(getDockerCommand(), [
    "inspect",
    "-f",
    "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}",
    containerId,
  ]);

  if (inspect.exitCode !== 0) {
    return "unknown";
  }

  return inspect.stdout.trim() || "unknown";
}

async function waitForPort(host, port, timeoutMs = 60000) { // readiness check — it waits until a database (or any TCP service) is actually accepting connections before your app continues.
  const start = Date.now(); 
  const normalizedPort = Number(port);
  if (!Number.isInteger(normalizedPort) || normalizedPort <= 0) {
    throw new Error(`Invalid DB_PORT for readiness check: ${String(port)}`);
  }

  while (Date.now() - start < timeoutMs) {
    const isOpen = await new Promise((resolve) => {
      const socket = new net.Socket();
      const cleanup = () => {
        socket.removeAllListeners("connect");
        socket.removeAllListeners("error");
        socket.removeAllListeners("timeout");
      };

      socket.setTimeout(1000);
      socket.once("connect", () => {
        cleanup();
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        cleanup();
        socket.destroy();
        resolve(false);
      });
      socket.once("timeout", () => {
        cleanup();
        socket.destroy();
        resolve(false);
      });
      socket.connect(normalizedPort, host);
    });

    if (isOpen) {
      return;
    }
    await sleep(500);
  }

  throw new Error(`Timed out waiting for TCP ${host}:${port} to become available.`);
}

export async function waitForTestDbReady(options = {}) {
  loadTestEnv();

  const composeFile = await resolveComposeFile(options.composeFile ?? state.composeFile);
  const serviceName = await resolveServiceName({ serviceName: options.serviceName ?? state.serviceName });
  const timeoutMs = Number(options.timeoutMs ?? process.env.TEST_DB_READY_TIMEOUT_MS ?? 60000);
  const start = Date.now();

  if (!composeFile) {
    throw new Error("Docker compose file is required to wait for DB readiness.");
  }

  while (Date.now() - start < timeoutMs) {
    const containerId = await getContainerId(composeFile, serviceName);
    if (!containerId) {
      await sleep(500);
      continue;
    }

    const health = await getContainerHealthStatus(containerId);
    if (health === "healthy") {
      return {
        ready: true,
        mode: "healthcheck",
        containerId,
        composeFile,
        serviceName,
      };
    }

    if (health === "none") {
      const host = String(process.env.DB_HOST || "localhost");
      const port = String(process.env.DB_PORT || "5432");
      await waitForPort(host, port, timeoutMs); // check does db ready to accept connection (socket try to connect port if connect then socket destroy and resolve true)
      return {
        ready: true,
        mode: "port",
        containerId,
        composeFile,
        serviceName,
      };
    }

    await sleep(500);
  }

  throw new Error(`Timed out waiting for database container health for service "${serviceName}".`);
}

function registerProcessCleanup() {
  if (state.cleanupRegistered) {
    return;
  }

  state.cleanupRegistered = true;

  const cleanup = () => {
    void stopTestDbContainer().catch(() => {});
  };

  process.once("exit", cleanup);
  process.once("SIGINT", cleanup);
  process.once("SIGTERM", cleanup);
}

export async function startTestDbContainer(options = {}) {
  loadTestEnv();

  if (!isDbAutoManageEnabled()) {
    return { managed: false, started: false, startedByLifecycle: false };
  }

  if (state.started) {
    return {
      managed: true,
      started: true,
      startedByLifecycle: state.startedByLifecycle,
      composeFile: state.composeFile,
      serviceName: state.serviceName,
    };
  }

  if (state.startPromise) {
    return state.startPromise;
  }

  state.startPromise = (async () => {
    const composeFile = await resolveComposeFile(options.composeFile);
    if (!composeFile) {
      throw new Error(
        "TEST_DB_AUTO_MANAGE is enabled but no docker compose file was found."
      );
    }

    const serviceName = await resolveServiceName(options);
    const alreadyRunning = await isServiceRunning(composeFile, serviceName);
    const args = ["compose", "-f", composeFile, "up", "-d", serviceName];
    await runCommand(getDockerCommand(), args, { cwd: path.dirname(composeFile) });

    state.started = true;
    state.startedByLifecycle = !alreadyRunning;
    state.composeFile = composeFile;
    state.serviceName = serviceName;

    await waitForTestDbReady({
      composeFile,
      serviceName,
      timeoutMs: options.timeoutMs,
    });

    registerProcessCleanup();

    return {
      managed: true,
      started: true,
      startedByLifecycle: state.startedByLifecycle,
      composeFile,
      serviceName,
    };
  })();

  try {
    return await state.startPromise;
  } finally {
    state.startPromise = null;
  }
}

export async function stopTestDbContainer(options = {}) {
  const shouldManage = isDbAutoManageEnabled() || state.started;
  if (!shouldManage) {
    return { managed: false, stopped: false };
  }

  if (state.stopPromise) {
    return state.stopPromise;
  }

  state.stopPromise = (async () => {
    const composeFile =
      options.composeFile ??
      state.composeFile ??
      (await resolveComposeFile(options.composeFile));

    const serviceName = options.serviceName ?? state.serviceName ?? process.env.TEST_DB_SERVICE_NAME;
    if (!composeFile || !serviceName) {
      state.started = false;
      state.startedByLifecycle = false;
      state.composeFile = null;
      state.serviceName = null;
      return { managed: false, stopped: false };
    }

    const stopAllowed = options.force === true || state.startedByLifecycle === true;
    if (!stopAllowed) {
      return {
        managed: true,
        stopped: false,
        composeFile,
        serviceName,
        startedByLifecycle: state.startedByLifecycle,
      };
    }

    const args = ["compose", "-f", composeFile, "down", "--remove-orphans"];
    const removeVolumes =
      options.removeVolumes === true || process.env.TEST_DB_REMOVE_VOLUMES === "true";
    if (removeVolumes) {
      args.push("--volumes");
    }

    await runCommand(getDockerCommand(), args, { cwd: path.dirname(composeFile) });

    state.started = false;
    state.startedByLifecycle = false;
    state.composeFile = null;
    state.serviceName = null;

    return {
      managed: true,
      stopped: true,
      composeFile,
      serviceName,
      startedByLifecycle: true,
    };
  })();

  try {
    return await state.stopPromise;
  } finally {
    state.stopPromise = null;
  }
}
