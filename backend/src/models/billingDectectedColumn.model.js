// models/BillingDetectedColumn.js
import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

const BillingDetectedColumn = sequelize.define(
  "BillingDetectedColumn",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clientid:{
      type: DataTypes.UUID,
      allowNull: false
    },

    provider: {
      type: DataTypes.STRING,
      allowNull: false
    },

    column_name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    first_seen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "billing_detected_columns",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["clientid" , "provider", "column_name"]
      }
    ]
  }
);

export default BillingDetectedColumn;


