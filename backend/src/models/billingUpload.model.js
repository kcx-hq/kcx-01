import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

const BillingUploads = sequelize.define(
  "BillingUploads",
  {
    uploadid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    clientid: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    uploadedby: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    filesize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    billingperiodstart: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    billingperiodend: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    checksum: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    uploadedat: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    // ✅ NEW STATUS COLUMN
    status: {
      type: DataTypes.ENUM("PENDING", "PROCESSING", "COMPLETED", "FAILED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
  },
  {
    tableName: "billing_uploads",
    timestamps: false,
  }
);

export default BillingUploads;


