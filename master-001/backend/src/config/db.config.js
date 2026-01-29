import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`
});


const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // disable logging; set to console.log to see the raw SQL queries
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
