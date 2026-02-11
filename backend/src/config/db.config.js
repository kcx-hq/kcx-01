import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`
});


const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: (sql, timing) => {
    if (timing && timing > 100) {
      console.log(
        JSON.stringify({
          type: "db_slow_query",
          duration_ms: timing,
          sql: sql.slice(0, 500),
        })
      );
    }
  },
   pool: {
    max: 10,
    min: 2,        // keeps warm connections (VERY important for Neon)
    acquire: 10000,
    idle: 30000,
  },
  benchmark: true,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // needed for Supabase
    },
  },
  define: {
    schema: 'public', // ensures tables are created in public schema
    freezeTableName: false, // allows pluralization of table names
    timestamps: false,      // disable default createdAt/updatedAt
  },
});

export default sequelize;
