// models/RawAwsBillingRow.js

import sequelize from "../config/db.config.js";
import { DataTypes } from "sequelize";

const RawAwsBillingRow = sequelize.define(
  "RawAwsBillingRow",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // maps to gen_random_uuid()
    },

    source_s3_key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    row_data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    ingested_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "raw_aws_billing_rows",
    schema: "public",
    timestamps: false, // because you already use ingested_at
    indexes: [
      {
        name: "idx_raw_aws_billing_rows_ingested_at",
        fields: ["ingested_at"],
      },
      {
        name: "idx_raw_aws_billing_rows_source_s3_key",
        fields: ["source_s3_key"],
      },
    ],
  },
);

export default RawAwsBillingRow;
