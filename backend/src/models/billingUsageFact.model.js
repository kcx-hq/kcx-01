import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

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

    consumedquantity: DataTypes.DECIMAL(10 , 2),
    consumedunit: DataTypes.STRING(128),

    pricingquantity: DataTypes.DECIMAL(10 , 2),
    pricingunit: DataTypes.STRING(128),

    listunitprice: DataTypes.DECIMAL(10 , 2),
    contractedunitprice: DataTypes.DECIMAL(10 , 2),

    listcost: DataTypes.DECIMAL(10 , 2),
    contractedcost: DataTypes.DECIMAL(10 , 2),
    effectivecost: DataTypes.DECIMAL(10 , 2),
    billedcost: DataTypes.DECIMAL(10 , 2),

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