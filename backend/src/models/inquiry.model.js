import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

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
      type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED", "STANDBY", "HANDLED", "TRASHED"),
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
    boss_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    boss_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    relay_severity: {
      type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
      allowNull: true,
    },
    relay_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    relayed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    trashed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "inquiries",
    timestamps: true,
    underscored: true, // updated_at
    createdAt: "activity_time",
  }
);

export default Inquiry;


