import { createRequire } from "module";
import { DataTypes } from "sequelize";
import crypto from "crypto";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

// --- Encryption Setup ---
const RAW_KEY = String(process.env.CRED_ENC_KEY || "").trim();
const KEY =
  /^[a-f0-9]{64}$/i.test(RAW_KEY) ? Buffer.from(RAW_KEY, "hex") : null;
const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function ensureEncryptionKey() {
  if (!KEY) {
    throw new Error("CRED_ENC_KEY must be set to a 64-char hex key");
  }
}

function encrypt(text) {
  if (!text) return text;
  ensureEncryptionKey();

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(text), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decrypt(payload) {
  if (!payload) return payload;
  ensureEncryptionKey();

  const [ivB64, tagB64, encryptedB64] = String(payload).split(":");

  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

function looksEncrypted(value) {
  if (!value) return false;
  return String(value).split(":").length === 3;
}

// --- Model ---
const CloudAccountCredential = sequelize.define(
  "CloudAccountCredential",
  {
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "clientid",
    },
    accountId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "accountid",
    },
    accessKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "accesskey",
    },
    secretAccessKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "secretaccesskey",
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "cloud_account_credentials",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["clientid", "accountid"],
      },
    ],
    hooks: {
      beforeCreate(instance) {
        if (!looksEncrypted(instance.accessKey)) {
          instance.accessKey = encrypt(instance.accessKey);
        }
        if (!looksEncrypted(instance.secretAccessKey)) {
          instance.secretAccessKey = encrypt(instance.secretAccessKey);
        }
      },

      beforeUpdate(instance) {
        if (instance.changed("accessKey") && !looksEncrypted(instance.accessKey)) {
          instance.accessKey = encrypt(instance.accessKey);
        }
        if (
          instance.changed("secretAccessKey") &&
          !looksEncrypted(instance.secretAccessKey)
        ) {
          instance.secretAccessKey = encrypt(instance.secretAccessKey);
        }
      },

      beforeBulkCreate(instances) {
        for (const instance of instances) {
          if (!looksEncrypted(instance.accessKey)) {
            instance.accessKey = encrypt(instance.accessKey);
          }
          if (!looksEncrypted(instance.secretAccessKey)) {
            instance.secretAccessKey = encrypt(instance.secretAccessKey);
          }
        }
      },
    },
  }
);

//
// ✅ Add Instance Methods for Decryption
//
CloudAccountCredential.prototype.getDecryptedAccessKey = function () {
  return decrypt(this.accessKey);
};

CloudAccountCredential.prototype.getDecryptedSecretAccessKey = function () {
  return decrypt(this.secretAccessKey);
};

export default CloudAccountCredential;

