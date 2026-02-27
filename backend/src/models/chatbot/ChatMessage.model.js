// src/models/ChatMessage.model.js
import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../../db/index.cjs");

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    sender: {
      type: DataTypes.ENUM("user", "bot"),
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "chat_messages",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["session_id"] }, { fields: ["created_at"] }],
  },
);


export default ChatMessage

