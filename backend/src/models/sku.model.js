import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Sku = sequelize.define(
  "Sku",
  {
    skuid: {
      type: DataTypes.STRING(128),
      primaryKey: true,
      // AWS SKU / Azure MeterId / GCP SKU ID
    },

    skupriceid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      // Price dimension ID / RateCard ID
    },

    pricingcategory: {
      type: DataTypes.STRING(50),
      allowNull: true,
      // OnDemand | Reserved | Spot | Preemptible
    },

    pricingunit: {
      type: DataTypes.STRING(128),
      allowNull: true,
      // Hours | GB-Month | Requests
    },
  },
  {
    tableName: "skus",
    timestamps: false,

    indexes: [
      { fields: ["pricingcategory"] },
      { fields: ["pricingunit"] },
    ],
  }
);

export default Sku;
