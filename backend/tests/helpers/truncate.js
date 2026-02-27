import { assertSafeDatabaseUrl, loadTestEnv } from "./env.js";
import { connectDb } from "./db.js";

const PROTECTED_TABLES = new Set(["SequelizeMeta", "SequelizeData"]);

let truncatePromise = null;

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, "\"\"")}"`;
}

export async function truncateAllTables(options = {}) {
  loadTestEnv();
  assertSafeDatabaseUrl();

  if (truncatePromise) {
    return truncatePromise;
  }

  truncatePromise = (async () => {
    const sequelize = options.sequelize ?? (await connectDb());

    const [rows] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
    );

    const tableNames = rows
      .map((row) => row.tablename)
      .filter((name) => name && !PROTECTED_TABLES.has(name));

    if (tableNames.length === 0) {
      return;
    }

    const joinedTableNames = tableNames.map(quoteIdentifier).join(", ");
    await sequelize.query(`TRUNCATE TABLE ${joinedTableNames} RESTART IDENTITY CASCADE;`);
  })();

  try {
    await truncatePromise;
  } finally {
    truncatePromise = null;
  }
}
