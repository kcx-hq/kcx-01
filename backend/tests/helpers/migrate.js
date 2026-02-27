import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTestEnv } from "./env.js";
import { startTestDbContainer } from "./docker.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const backendRoot = path.resolve(currentDir, "..", "..");
const sequelizeCliPath = path.resolve(
  backendRoot,
  "node_modules",
  "sequelize-cli",
  "lib",
  "sequelize"
);

let migrationPromise = null;

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

export async function runMigrations(options = {}) {
  loadTestEnv();

  const startDocker = options.startDocker !== false;
  if (startDocker) {
    await startTestDbContainer(options);
  }

  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = runCommand(
    process.execPath,
    [sequelizeCliPath, "db:migrate", "--env", "test"],
    {
      cwd: backendRoot,
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    }
  );

  try {
    return await migrationPromise;
  } finally {
    migrationPromise = null;
  }
}
