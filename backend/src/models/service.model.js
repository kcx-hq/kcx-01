import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Service = sequelize.define(
  "Service",
  {
    serviceid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    providername: {
      type: DataTypes.STRING(20),
      allowNull: false,
      // aws | azure | gcp
    },

    servicename: {
      type: DataTypes.STRING(64),
      allowNull: true,
      // AmazonEC2 | AzureVM | BigQuery
    },

    servicecategory: {
      type: DataTypes.STRING(50),
      allowNull: true,
      // Compute | Storage | Network | Database
    },
  },
  {
    tableName: "services",
    timestamps: false,

    indexes: [
      {
        unique: true,
        fields: ["providername", "servicename"],
      },
      {
        fields: ["servicecategory"],
      },
    ],
  }
);

export default Service;
