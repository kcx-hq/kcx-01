import { createRequire } from "module";

const require = createRequire(import.meta.url);
const logger = require("./logger.cjs");

export default logger;
export { logger };
