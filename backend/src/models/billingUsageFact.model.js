import { createRequire } from "module";
import { DataTypes } from "sequelize";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

const BillingUsageFact = sequelize.define(
  "BillingUsageFact",
  {
   id: {
      type: DataTypes.UUID,
      defaultValue : DataTypes.UUIDV4 ,
      primaryKey: true,
    },

    uploadid: {
      type: DataTypes.UUID,
      allowNull: false,
      
    },

    cloudaccountid: {
      type: DataTypes.UUID,
      allowNull: false,
      
    },

    serviceid: {
      type: DataTypes.UUID,
      allowNull: false,
      
    },

    regionid: {
      type: DataTypes.UUID, 
      allowNull: false,
      
    },

    skuid: {
      type: DataTypes.STRING(128),
      
    },

    resourceid: {
      type: DataTypes.STRING(512),
      
    },

    subaccountid: {
      type: DataTypes.STRING(614), 
      
    },

    commitmentdiscountid: {
      type: DataTypes.STRING(128),
      
    },

    chargecategory: DataTypes.STRING(50),
    chargeclass: DataTypes.STRING(50),
    chargedescription: DataTypes.TEXT,
    chargefrequency: DataTypes.STRING(30),

    consumedquantity: DataTypes.DECIMAL(24, 12),
    consumedunit: DataTypes.STRING(128),

    pricingquantity: DataTypes.DECIMAL(24, 12),
    pricingunit: DataTypes.STRING(128),

    listunitprice: DataTypes.DECIMAL(24, 12),
    contractedunitprice: DataTypes.DECIMAL(24, 12),

    listcost: DataTypes.DECIMAL(24, 12),
    contractedcost: DataTypes.DECIMAL(24, 12),
    effectivecost: DataTypes.DECIMAL(24, 12),
    billedcost: DataTypes.DECIMAL(24, 12),

    billingperiodstart: DataTypes.DATEONLY,
    billingperiodend: DataTypes.DATEONLY,
    chargeperiodstart: DataTypes.DATE,
    chargeperiodend: DataTypes.DATE,

    tags: {
      type :  DataTypes.JSONB ,
      allowNull : false ,
      defaultValue : {}
    },

    createdat: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "billing_usage_fact",
    timestamps: false,
    indexes: [
      { fields: ['uploadid'] },
      { fields: ['chargeperiodstart'] },
      { fields: ['billedcost'] },
      { fields: ['uploadid', 'chargeperiodstart'] },
      { fields: ['cloudaccountid'] },
      { fields: ['serviceid'] },
      { fields: ['regionid'] },
      { fields: ['resourceid'] },
    ]
  }
);

export default BillingUsageFact

