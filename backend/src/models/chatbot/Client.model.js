// src/models/Client.model.js
import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../../db/index.cjs");

const Client = sequelize.define(
  "Client",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    company: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: { isEmail: true },
    },
  },
  {
    tableName: "clients",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default Client;


