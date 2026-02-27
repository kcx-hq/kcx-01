import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

const ClientS3Integrations = sequelize.define(
  "ClientS3Integrations",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    clientid: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    region: {
      type: DataTypes.STRING,
      defaultValue: "ap-south-1",
    },

    bucket: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    prefix: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    rolearn: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    externalid: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    lastpolledat: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    lasterror: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    createdat: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updatedat: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "client_s3_integrations",
    timestamps: false,
  }
);

export default ClientS3Integrations;

