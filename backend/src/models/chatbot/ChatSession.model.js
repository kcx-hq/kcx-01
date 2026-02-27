// src/models/ChatSession.model.js
import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../../db/index.cjs");

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
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "{}",
      get() {
        const raw = this.getDataValue("requirements");
        if (!raw) {
          return {};
        }
        if (typeof raw === "object") {
          return raw;
        }
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      },
      set(value) {
        if (value === null || typeof value === "undefined") {
          this.setDataValue("requirements", "{}");
          return;
        }
        if (typeof value === "string") {
          this.setDataValue("requirements", value);
          return;
        }
        this.setDataValue("requirements", JSON.stringify(value));
      },
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
    ],
  },
);

export default ChatSession;

