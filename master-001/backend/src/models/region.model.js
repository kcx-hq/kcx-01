import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Region = sequelize.define(
  "Region",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true, // ✅ SURROGATE KEY
    },

    providername: {
      type: DataTypes.STRING(20),
      allowNull: false,
      // aws | azure | gcp
    },

    regioncode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // aws: us-east-1
      // azure: eastus
      // gcp: us-central1
    },

    regionname: {
      type: DataTypes.STRING(64),
      allowNull: true,
      // US East (N. Virginia)
    },

    availabilityzone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      // us-east-1a | 1 | az1
    },
  },
  {
    tableName: "regions",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["providername", "regioncode"], // ✅ NATURAL KEY
      },
      {
        fields: ["availabilityzone"],
      },
    ],
  }
);

export default Region;
