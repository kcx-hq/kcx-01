const path = require("path");
const dotenv = require("dotenv");

const nodeEnv = process.env.NODE_ENV || "development";
const envPath = path.resolve(__dirname, `../../.env.${nodeEnv}`);
dotenv.config({ path: envPath, quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Sequelize configuration");
}

const isSslDisabled = process.env.DB_SSL === "false";
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";

const shared = {
  use_env_variable: "DATABASE_URL",
  dialect: "postgres",
  logging: false,
  migrationStorageTableName: "SequelizeMeta",
  seederStorage: "sequelize",
  seederStorageTableName: "SequelizeData",
  dialectOptions: isSslDisabled
    ? {}
    : {
        ssl: {
          require: true,
          rejectUnauthorized,
        },
      },
};

module.exports = {
  development: { ...shared },
  test: { ...shared },
  production: { ...shared },
};
