// Import models
import Client from './Client.js';
import User from './User.js';
import Inquiry from './inquiry.model.js';
import BillingUpload from './billingUpload.model.js';
import BillingUsageFact from './billingUsageFact.model.js';
import CloudAccount from './cloudAccount.model.js';
import Region from './region.model.js';
import Resource from './resource.model.js';
import Service from './service.model.js';
import Sku from './sku.model.js';
import SubAccount from './subAccount.model.js';
import CommitmentDiscount from './commitmentDiscount.model.js';
import BillingColumnMapping from "./billingColumnMapping.model.js";
import BillingDetectedColumn from "./billingDectectedColumn.model.js";
import MappingSuggestion from "./mappingSuggestion.model.js"
import ChatSession from "./chatbot/ChatSession.model.js";
import ChatMessage from "./chatbot/ChatMessage.model.js";
import RawAwsBillingRow from "./rawBillingRaw.model.js";
import ClientS3Integrations from "./clientS3Intergration.model.js";
import CloudAccountCredentials from "./cloudAccountCredentials.model.js";

/* =========================
   Define Associations
========================= */

// Client ↔ User
Client.hasMany(User, { foreignKey: 'client_id', as: 'users' });
User.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Client.hasMany(ClientS3Integrations, { foreignKey: 'clientid', as: 'client_s3_integrations' });
ClientS3Integrations.belongsTo(Client, { foreignKey: 'clientid', as: 'client' });

Client.hasMany(CloudAccountCredentials, { foreignKey: 'clientid', as: 'cloud_account_credentials' });
CloudAccountCredentials.belongsTo(Client, { foreignKey: 'clientid', as: 'client' });

Client.hasMany(BillingColumnMapping, {
  foreignKey: 'clientid',
  as: 'billingColumnMappings'
});

BillingColumnMapping.belongsTo(Client, {
  foreignKey: 'clientid',
  as: 'client'
});


Client.hasMany(BillingDetectedColumn, {
  foreignKey: 'clientid',
  as: 'billingDetectedColumns'
});

BillingDetectedColumn.belongsTo(Client, {
  foreignKey: 'clientid',
  as: 'client'
});


Client.hasMany(MappingSuggestion, {
  foreignKey: 'clientid',
  as: 'mappingSuggestions'
});

MappingSuggestion.belongsTo(Client, {
  foreignKey: 'clientid',
  as: 'client'
});


// Client ↔ BillingUpload
Client.hasMany(BillingUpload, { foreignKey: 'clientid', as: 'billingUploads' });
BillingUpload.belongsTo(Client, { foreignKey: 'clientid', as: 'client' });

// User ↔ BillingUpload
User.hasMany(BillingUpload, { foreignKey: 'uploadedby', as: 'uploadedBillingFiles' });
BillingUpload.belongsTo(User, { foreignKey: 'uploadedby', as: 'uploadedBy' });


// BillingUpload ↔ BillingUsageFact
BillingUpload.hasMany(BillingUsageFact, { foreignKey: 'uploadid', as: 'usageRecords' });
BillingUsageFact.belongsTo(BillingUpload, { foreignKey: 'uploadid', as: 'upload' });

// CloudAccount ↔ BillingUsageFact
CloudAccount.hasMany(BillingUsageFact, { foreignKey: 'cloudaccountid', as: 'usageRecords' });
BillingUsageFact.belongsTo(CloudAccount, { foreignKey: 'cloudaccountid', as: 'cloudAccount' });

// Service ↔ BillingUsageFact
Service.hasMany(BillingUsageFact, { foreignKey: 'serviceid', as: 'usageRecords' });
BillingUsageFact.belongsTo(Service, { foreignKey: 'serviceid', as: 'service' });

// SKU ↔ BillingUsageFact
Sku.hasMany(BillingUsageFact, { foreignKey: 'skuid', as: 'usageRecords' });
BillingUsageFact.belongsTo(Sku, { foreignKey: 'skuid', as: 'sku' });

// Resource ↔ BillingUsageFact
Resource.hasMany(BillingUsageFact, { foreignKey: 'resourceid', as: 'usageRecords' });
BillingUsageFact.belongsTo(Resource, { foreignKey: 'resourceid', as: 'resource' });

// Region ↔ BillingUsageFact
Region.hasMany(BillingUsageFact, { foreignKey: 'regionid', as: 'usageRecords' });
BillingUsageFact.belongsTo(Region, { foreignKey: 'regionid', as: 'region' });

// SubAccount ↔ BillingUsageFact
SubAccount.hasMany(BillingUsageFact, { foreignKey: 'subaccountid', as: 'usageRecords' });
BillingUsageFact.belongsTo(SubAccount, { foreignKey: 'subaccountid', as: 'subAccount' });

// CommitmentDiscount ↔ BillingUsageFact
CommitmentDiscount.hasMany(BillingUsageFact, { foreignKey: 'commitmentdiscountid', as: 'usageRecords' });
BillingUsageFact.belongsTo(CommitmentDiscount, { foreignKey: 'commitmentdiscountid', as: 'commitmentDiscount' });



Client.hasMany(ChatSession, {
    foreignKey: "client_id",
    as: "sessions",
  });

  ChatSession.belongsTo(Client, {
    foreignKey: "client_id",
    as: "client",
  });

  ChatSession.hasMany(ChatMessage, {
    foreignKey: "session_id",
    as: "messages",
    onDelete: "CASCADE",
    hooks: true,
  });

  ChatMessage.belongsTo(ChatSession, {
    foreignKey: "session_id",
    as: "session",
  });

/* =========================
   Export Models & Sequelize
========================= */
export {
  
  Client,
  User,
  Inquiry,
  BillingUpload,
  BillingUsageFact,
  CloudAccount,
  Region,
  Resource,
  Service,
  Sku,
  SubAccount,
  CommitmentDiscount,
  BillingColumnMapping ,
  BillingDetectedColumn,
  MappingSuggestion,
  ChatSession,
  ChatMessage,
  RawAwsBillingRow,
  ClientS3Integrations,
  CloudAccountCredentials
};


