import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

const SubAccount = sequelize.define(
  "SubAccount",
  {
    subaccountid: {
      type: DataTypes.STRING(128),
      primaryKey: true,
      // AWS account ID (12 digits)
      // Azure subscription ID
      // GCP project ID
    },

    subaccountname: {
      type: DataTypes.STRING(128),
      allowNull: true,
      // Human readable account / project name
    },
  },
  {
    tableName: "sub_accounts",
    timestamps: false,

    indexes: [
      { fields: ["subaccountname"] },
    ],
  }
);

export default SubAccount;


