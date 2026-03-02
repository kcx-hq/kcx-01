import sequelize from "../src/config/db.config.js";

const ALTER_STATEMENTS = [
  "ALTER TABLE billing_usage_fact ALTER COLUMN consumedquantity TYPE NUMERIC(24,12)",
  "ALTER TABLE billing_usage_fact ALTER COLUMN pricingquantity TYPE NUMERIC(24,12)",
  "ALTER TABLE billing_usage_fact ALTER COLUMN listunitprice TYPE NUMERIC(24,12)",
  "ALTER TABLE billing_usage_fact ALTER COLUMN contractedunitprice TYPE NUMERIC(24,12)",
  "ALTER TABLE billing_usage_fact ALTER COLUMN listcost TYPE NUMERIC(24,12)",
  "ALTER TABLE billing_usage_fact ALTER COLUMN contractedcost TYPE NUMERIC(24,12)",
  "ALTER TABLE billing_usage_fact ALTER COLUMN effectivecost TYPE NUMERIC(24,12)",
  "ALTER TABLE billing_usage_fact ALTER COLUMN billedcost TYPE NUMERIC(24,12)",
];

async function run() {
  try {
    await sequelize.authenticate();
    for (const statement of ALTER_STATEMENTS) {
      await sequelize.query(statement);
      console.log(`OK: ${statement}`);
    }
    console.log("Billing precision upgrade completed.");
  } catch (error) {
    console.error("Billing precision upgrade failed:", error?.message || error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
