// models/MappingSuggestion.js
import sequelize from '../config/db.config.js';
import { DataTypes } from 'sequelize';
  const MappingSuggestion = sequelize.define(
    "MappingSuggestion",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      uploadid: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      provider: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      source_column: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      internal_field: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },

      detectedtype: {
        type: DataTypes.STRING(20),
      },

      reasons: {
        type: DataTypes.JSONB,
      },

      automapped: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      clientid : {
        type: DataTypes.UUID 
      },

      status: {
        type: DataTypes.STRING(20),
        defaultValue: "suggested",
      },
    },
    {
      tableName: "mapping_suggestions",
      indexes: [
        {
          unique: true,
          fields: ["clientid", "source_column", "internal_field"],
        },
      ],
    }
  );

export default MappingSuggestion
