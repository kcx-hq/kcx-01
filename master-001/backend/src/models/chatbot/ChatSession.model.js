// src/models/ChatSession.model.js
import { DataTypes } from "sequelize";
import sequelize from "../../config/db.config.js";

const ChatSession = sequelize.define(
  "ChatSession",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    client_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    step_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM("active", "completed", "abandoned"),
      allowNull: false,
      defaultValue: "active",
    },

    // Postgres JSONB (perfect for requirement capture)
    requirements: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: "chat_sessions",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["status"] },
      { fields: ["created_at"] },
      { using: "GIN", fields: ["requirements"] }, // JSONB search
    ],
  },
);

export default ChatSession;