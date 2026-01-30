import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Resource = sequelize.define(
  "Resource",
  {
    resourceid: {
      type: DataTypes.STRING(512),
      primaryKey: true,
      // AWS ARN / Azure resource ID / GCP full resource path
    },

    resourcename: {
      type: DataTypes.STRING(128),
      allowNull: true,
      // Human readable name (from tags or display name)
    },

    resourcetype: {
      type: DataTypes.STRING(64),
      allowNull: true,
      // ec2:instance | vm | disk | sql | bucket
    },
  },
  {
    tableName: "resources",
    timestamps: false,

    indexes: [
      { fields: ["resourcetype"] },
    ],
  }
);

export default Resource;
