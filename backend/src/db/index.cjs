const { Sequelize } = require("sequelize");
const config = require("./config.cjs");
const logger = require("../lib/logger.cjs");

const nodeEnv = process.env.NODE_ENV || "development";
const envConfig = config[nodeEnv] || config.development;

const logging =
  process.env.DB_LOGGING === "true"
    ? (sql) => logger.debug({ sql }, "sequelize query")
    : false;
const connectionVarName = envConfig.use_env_variable;
const databaseUrl = connectionVarName
  ? process.env[connectionVarName]
  : envConfig.url;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Sequelize");
}

const sequelizeOptions = {
  ...envConfig,
  logging,
};

delete sequelizeOptions.use_env_variable;
delete sequelizeOptions.url;
delete sequelizeOptions.migrationStorageTableName;
delete sequelizeOptions.seederStorage;
delete sequelizeOptions.seederStorageTableName;

const sequelize = new Sequelize(databaseUrl, sequelizeOptions);

module.exports = {
  Sequelize,
  sequelize,
};
