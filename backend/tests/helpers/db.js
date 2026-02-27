import { Sequelize } from "sequelize";
import { assertSafeDatabaseUrl, getTestEnv, loadTestEnv } from "./env.js";

let sequelizeInstance = null;
let initialized = false;
let connectPromise = null;
let closePromise = null;

function buildSequelize() {
  const env = getTestEnv();
  const sslEnabled = env.DB_SSL !== "false";
  const rejectUnauthorized = env.DB_SSL_REJECT_UNAUTHORIZED !== "false";

  const dialectOptions = sslEnabled
    ? {
        ssl: {
          require: true,
          rejectUnauthorized,
        },
      }
    : {};

  return new Sequelize(env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
      acquire: 30000,
    },
    dialectOptions,
  });
}

export function getDbConnection() {
  loadTestEnv();
  assertSafeDatabaseUrl(); // check url is correct ot not 

  if (!sequelizeInstance) { // checking if sequelizeInstance already exist or not (if not built or else direct return )
    sequelizeInstance = buildSequelize();
  }

  return sequelizeInstance;
}

export async function connectDb() {
  loadTestEnv();
  assertSafeDatabaseUrl();

  if (closePromise) { // if db closing wait for it 
    await closePromise;
  }

  if (initialized && sequelizeInstance) { // If already initialized and instance exists, return the existing connection
    return sequelizeInstance;
  }

  if (connectPromise) { // If a connection attempt is already in progress, return the existing promise
    return connectPromise;
  }

  connectPromise = (async () => {
    const connection = getDbConnection();
    await connection.authenticate();
    initialized = true;
    return connection;
  })(); // Start a new connection process and store its promise to prevent duplicate connections

  try {
    return await connectPromise; // wait for completing connection 
  } catch (error) {
    initialized = false;
    sequelizeInstance = null;
    throw new Error("Failed to connect to the test database.", { cause: error });
  } finally {
    connectPromise = null;
  }
}

export async function assertDbReachable() { // checking db reachable or not 
  const connection = await connectDb();
  const [rows] = await connection.query("SELECT 1 AS ok");
  const ok = rows?.[0]?.ok;
  if (Number(ok) !== 1) {
    throw new Error("Test database is reachable but did not return expected readiness response.");
  }
  return connection;
}

export async function closeDb() {
  if (!sequelizeInstance) { // if instance not found instialize=false and return 
    initialized = false;
    return;
  }

  if (closePromise) {
    return closePromise;
  } // if close promise exist return it 

  closePromise = (async () => {
    const activeConnection = sequelizeInstance;
    sequelizeInstance = null;
    initialized = false;
    await activeConnection.close();
  })(); // when closing start it return promise (shows closing is in process)

  try {
    await closePromise;
  } finally {
    closePromise = null;
  }
}
