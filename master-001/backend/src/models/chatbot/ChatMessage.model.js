// src/models/ChatMessage.model.js
import { DataTypes } from "sequelize";
import sequelize from "../../config/db.config.js";

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
    updatedAt: false,
    indexes: [{ fields: ["session_id"] }, { fields: ["created_at"] }],
  },
);


export default ChatMessage