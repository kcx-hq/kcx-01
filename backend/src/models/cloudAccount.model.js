import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

const CloudAccount = sequelize.define(
  "CloudAccount",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    providername: {
      type: DataTypes.STRING(20),
      allowNull: false,
      // aws | azure | gcp | oracle
    },

    billingaccountid: {
      type: DataTypes.STRING(64),
      allowNull: false,
      // AWS payer account (12 digits)
      // Azure billing account / enrollment
      // GCP billing account (XXXXXX-XXXXXX-XXXXXX)
    },

    billingaccountname: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },

    billingcurrency: {
      type: DataTypes.STRING(3),
      allowNull: true,
      // ISO-4217 (USD, INR, EUR)
    },

    invoiceissuername: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },

    publishername: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
  },
  {
    tableName: "cloud_accounts",
    timestamps: false,

    indexes: [
      {
        unique: true,
        fields: ["providername", "billingaccountid"],
      },
    ],
  }
);

export default CloudAccount;


