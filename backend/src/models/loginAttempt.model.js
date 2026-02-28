import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const LoginAttempt = sequelize.define(
  "LoginAttempt",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: { type: DataTypes.STRING, allowNull: false },
    ip: { type: DataTypes.STRING, allowNull: false },
    failed_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    first_failed_at: { type: DataTypes.DATE, allowNull: true },
    last_failed_at: { type: DataTypes.DATE, allowNull: true },
    blocked_until: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "login_attempts",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["email", "ip"] },
      { fields: ["blocked_until"] },
      { fields: ["last_failed_at"] },
    ],
  }
);

export default LoginAttempt;
