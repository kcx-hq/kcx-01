import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

const DashboardBudgetTarget = sequelize.define(
  "DashboardBudgetTarget",
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
    monthkey: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: "All",
    },
    service: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: "All",
    },
    region: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: "All",
    },
    targetamount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    createdby: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedby: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "dashboard_budget_targets",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["clientid", "monthkey", "provider", "service", "region"],
        name: "dashboard_budget_targets_scope_unique",
      },
    ],
  }
);

export default DashboardBudgetTarget;
