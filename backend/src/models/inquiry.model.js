import sequelize from "../config/db.config.js";
import { DataTypes } from "sequelize";

const Inquiry = sequelize.define(
  "Inquiry",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
    },

    meet_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // ✅ NEW: Client preferred meeting date & time
    preferred_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    // ✅ NEW: Client timezone
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Asia/Kolkata",
    },
    action_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "inquiries",
    timestamps: true,
    underscored: true, // created_at, updated_at
  }
);

export default Inquiry;
