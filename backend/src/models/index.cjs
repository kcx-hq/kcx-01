const path = require("path");
const { pathToFileURL } = require("url");
const { sequelize, Sequelize } = require("../db/index.cjs");

let initPromise;

const db = {
  sequelize,
  Sequelize,
  models: {},
  async init() {
    if (!initPromise) {
      initPromise = (async () => {
        const entryPath = pathToFileURL(path.resolve(__dirname, "index.js")).href;
        const imported = await import(entryPath);

        for (const [name, value] of Object.entries(imported)) {
          if (value && typeof value === "function" && value.sequelize === sequelize) {
            db.models[name] = value;
            db[name] = value;
          }
        }

        for (const [name, model] of Object.entries(sequelize.models)) {
          if (!db.models[name]) {
            db.models[name] = model;
            db[name] = model;
          }
          if (typeof model.associate === "function") {
            model.associate(db.models);
          }
        }

        db.sequelize = sequelize;
        return db;
      })();
    }

    return initPromise;
  },
};

module.exports = db;
