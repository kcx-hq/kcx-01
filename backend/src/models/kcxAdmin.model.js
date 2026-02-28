import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";
import bcrypt from "bcrypt";

const KcxAdmin = sequelize.define(
  "KcxAdmin",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "kcx_admins",
    timestamps: false,
    hooks: {
      beforeCreate: async (admin) => {
        admin.password_hash = await bcrypt.hash(admin.password_hash, 10);
      },
      beforeUpdate: async (admin) => {
        if (admin.changed("password_hash")) {
          admin.password_hash = await bcrypt.hash(admin.password_hash, 10);
        }
      },
    },
  }
);

export default KcxAdmin;
