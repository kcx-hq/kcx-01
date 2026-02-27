// backend/scripts/generate-migrations-from-models.mjs
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_ROOT = path.resolve(__dirname, "..");
const MODELS_DIR = path.resolve(BACKEND_ROOT, "src/models");
const MIGRATIONS_DIR = path.resolve(BACKEND_ROOT, "src/db/migrations");

// Adjust if your models barrel file is different:
const MODELS_INDEX = path.resolve(MODELS_DIR, "index.js");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function timestampForFilename(d = new Date()) {
  return (
    d.getFullYear() +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds())
  );
}

// Very small mapper from Sequelize DataTypes -> migration Sequelize types.
// This is intentionally conservative; you can extend it as you find types in your models.
function mapType(attr) {
  // attr.type might be e.g. DataTypes.STRING(100) or DataTypes.UUID, etc.
  // When Sequelize models are loaded, this is already a real datatype object with .key and options.
  const t = attr.type;
  const key = t?.key || t?.constructor?.key || t?.toSql?.name;

  // Common keys: STRING, TEXT, UUID, DATE, INTEGER, BIGINT, BOOLEAN, ENUM, DECIMAL, FLOAT
  switch (key) {
    case "UUID":
      return "Sequelize.UUID";
    case "STRING":
      // length is often stored in t.options.length for STRING(100)
      if (t?.options?.length) return `Sequelize.STRING(${t.options.length})`;
      return "Sequelize.STRING";
    case "TEXT":
      return "Sequelize.TEXT";
    case "DATE":
      return "Sequelize.DATE";
    case "INTEGER":
      return "Sequelize.INTEGER";
    case "BIGINT":
      return "Sequelize.BIGINT";
    case "BOOLEAN":
      return "Sequelize.BOOLEAN";
    case "FLOAT":
      return "Sequelize.FLOAT";
    case "DECIMAL":
      if (t?.options?.precision && t?.options?.scale) {
        return `Sequelize.DECIMAL(${t.options.precision}, ${t.options.scale})`;
      }
      return "Sequelize.DECIMAL";
    case "ENUM":
      // enum values in t.values
      return `Sequelize.ENUM(${(t?.values || []).map((v) => JSON.stringify(v)).join(", ")})`;
    default:
      // fallback
      return "Sequelize.STRING";
  }
}

function mapDefaultValue(attr) {
  const dv = attr.defaultValue;

  // Most common safe defaults
  if (dv === undefined) return null;

  // UUIDV4 in models often appears as a function reference; migration can use Sequelize.UUIDV4
  if (dv?.toString?.().includes("UUIDV4")) return "Sequelize.UUIDV4";

  // Raw literals (rare) - skip for safety unless you know what it is
  if (typeof dv === "function") return null;

  if (typeof dv === "string") return JSON.stringify(dv);
  if (typeof dv === "number") return String(dv);
  if (typeof dv === "boolean") return dv ? "true" : "false";

  return null;
}

function colLine(name, attr) {
  const lines = [];
  lines.push(`${JSON.stringify(name)}: {`);

  const typeStr = mapType(attr);
  lines.push(`  type: ${typeStr},`);

  if (attr.allowNull === false) lines.push(`  allowNull: false,`);
  if (attr.primaryKey) lines.push(`  primaryKey: true,`);
  if (attr.autoIncrement) lines.push(`  autoIncrement: true,`);
  if (attr.unique) lines.push(`  unique: true,`);

  const def = mapDefaultValue(attr);
  if (def) lines.push(`  defaultValue: ${def},`);

  lines.push(`},`);
  return lines.join("\n");
}

function enumDropStatement(tableName, attrs) {
  // Postgres enum drop best-effort; Sequelize often creates enum type name enum_<table>_<column>
  const enumCols = Object.entries(attrs).filter(([_, a]) => (a.type?.key || a.type?.constructor?.key) === "ENUM");
  if (enumCols.length === 0) return "";
  return enumCols
    .map(([col]) => `    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_${tableName}_${col}";');`)
    .join("\n");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function main() {
  ensureDir(MIGRATIONS_DIR);

  // Import your models barrel (ESM). It should export named models like: export { default as Inquiry } from "./Inquiry.js";
  const imported = await import(pathToFileURL(MODELS_INDEX).href);

  const models = Object.entries(imported)
    .filter(([name, value]) => typeof value === "function" && value?.getTableName)
    .map(([name, model]) => ({ name, model }));

  if (models.length === 0) {
    console.error("No models found. Ensure src/models/index.js exports models as named exports.");
    process.exit(1);
  }

  const nowBase = new Date();

  for (let i = 0; i < models.length; i++) {
    const { name, model } = models[i];

    const tableName = typeof model.getTableName === "function" ? model.getTableName() : model.tableName;
    const attrs = model.rawAttributes;

    // timestamps/underscored are on options
    const timestamps = Boolean(model.options?.timestamps);
    const underscored = Boolean(model.options?.underscored);

    const createdCol = underscored ? "created_at" : "createdAt";
    const updatedCol = underscored ? "updated_at" : "updatedAt";

    const cols = [];
    for (const [colName, attr] of Object.entries(attrs)) {
      // Skip Sequelize internal virtual fields
      if (attr?._autoGenerated) continue;

      // If timestamps are enabled, we will explicitly add created/updated at the end
      if (timestamps && (colName === createdCol || colName === updatedCol)) continue;

      cols.push(colLine(colName, attr));
    }

    if (timestamps) {
      cols.push(
        `${JSON.stringify(createdCol)}: { type: Sequelize.DATE, allowNull: false },`,
        `${JSON.stringify(updatedCol)}: { type: Sequelize.DATE, allowNull: false },`
      );
    }

    // Make unique-ish timestamp per file
    const d = new Date(nowBase.getTime() + i * 1000);
    const ts = timestampForFilename(d);

    const filename = `${ts}-create-${String(tableName).replace(/[^a-zA-Z0-9_-]/g, "-")}.cjs`;
    const filepath = path.join(MIGRATIONS_DIR, filename);

    // Prevent overwriting if re-run
    if (fs.existsSync(filepath)) continue;

    const downEnumDrops = enumDropStatement(tableName, attrs);

    const content = `"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(${JSON.stringify(tableName)}, {
${cols.map((c) => "      " + c.replace(/\n/g, "\n      ")).join("\n")}
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(${JSON.stringify(tableName)});
${downEnumDrops ? "\n" + downEnumDrops + "\n" : ""}
  },
};
`;

    fs.writeFileSync(filepath, content, "utf8");
    console.log(`✅ Generated migration for ${name} -> ${filepath}`);
  }

  console.log("\nDone. Review generated migrations (ENUM defaults/indexes) then run db:migrate.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});