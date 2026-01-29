// src/models/Client.model.js
import { DataTypes } from "sequelize";
import sequelize from "../../config/db.config.js";

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
