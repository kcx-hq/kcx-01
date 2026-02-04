import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";
import { UserRole } from "./UserRole.js";
import bcrypt from "bcrypt"

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    client_id: { type: DataTypes.UUID, allowNull: true  ,  defaultValue: null},
    full_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      defaultValue: UserRole.USER,
    },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_premium: { type: DataTypes.BOOLEAN, defaultValue: false },
    verification_otp: { type: DataTypes.STRING, allowNull: true },
    verification_otp_expires: { type: DataTypes.DATE, allowNull: true },
    resetPasswordTokenHash: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    resetPasswordExpiresAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "users",
    hooks: {
        beforeCreate: async (user) => {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        },
        beforeUpdate: async (user) => {
          if (user.changed("password_hash")) {
            user.password_hash = await bcrypt.hash(user.password_hash, 10);
          }
        }
      }
  }
);

export default User;
