import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

const CommitmentDiscountModel = sequelize.define(
  "CommitmentDiscount",
  {
    commitmentdiscountid: {
      type: DataTypes.STRING(128),
      primaryKey: true,
      // ARN / Azure reservation ID / GCP commitment ID
    },

    commitmentdiscountname: {
      type: DataTypes.STRING(128),
      allowNull: true,
      // Human readable name
    },

    commitmentdiscountcategory: {
      type: DataTypes.STRING(50),
      allowNull: true,
      // ReservedInstance | SavingsPlan | CUD
    },

    commitmentdiscounttype: {
      type: DataTypes.STRING(50),
      allowNull: true,
      // Compute | EC2 | SQL | VM | Storage
    },

    commitmentdiscountstatus: {
      type: DataTypes.STRING(30),
      allowNull: true,
      // Active | Expired | Pending | Retired
    },
  },
  {
    tableName: "commitment_discounts",
    timestamps: false,

    indexes: [
      { fields: ["commitmentdiscountcategory"] },
      { fields: ["commitmentdiscountstatus"] },
    ],
  }
);

export default CommitmentDiscountModel;


