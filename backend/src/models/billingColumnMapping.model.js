// models/BillingColumnMapping.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const BillingColumnMapping = sequelize.define(
  "BillingColumnMapping",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clientid : {
      type: DataTypes.UUID ,
      allowNull : false
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false
    },

    internal_field: {
      type: DataTypes.STRING,
      allowNull: false
    },

    source_column: {
      type: DataTypes.STRING,
      allowNull: false
    },

    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  },
  {
    tableName: "billing_column_mappings",
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: "billing_column_mappings_clientid_provider_internal_field_source",
        unique: true,
        fields: ["clientid" ,"provider", "internal_field", "source_column"]
      }
    ]
  }
);

export default BillingColumnMapping;
