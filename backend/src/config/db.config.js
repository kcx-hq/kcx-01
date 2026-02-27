import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { sequelize } = require("../db/index.cjs");

export default sequelize;
