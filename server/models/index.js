const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'geocollect',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Form = require('./Form')(sequelize, Sequelize.DataTypes);
const FormField = require('./FormField')(sequelize, Sequelize.DataTypes);
const DataEntry = require('./DataEntry')(sequelize, Sequelize.DataTypes);
const DataValue = require('./DataValue')(sequelize, Sequelize.DataTypes);
const SyncQueue = require('./SyncQueue')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Form, { foreignKey: 'createdBy' });
Form.belongsTo(User, { foreignKey: 'createdBy' });

Form.hasMany(FormField, { foreignKey: 'formId', as: 'fields' });
FormField.belongsTo(Form, { foreignKey: 'formId' });

User.hasMany(DataEntry, { foreignKey: 'userId' });
DataEntry.belongsTo(User, { foreignKey: 'userId' });

Form.hasMany(DataEntry, { foreignKey: 'formId' });
DataEntry.belongsTo(Form, { foreignKey: 'formId' });

DataEntry.hasMany(DataValue, { foreignKey: 'dataEntryId', as: 'values' });
DataValue.belongsTo(DataEntry, { foreignKey: 'dataEntryId' });

FormField.hasMany(DataValue, { foreignKey: 'fieldId' });
DataValue.belongsTo(FormField, { foreignKey: 'fieldId' });

module.exports = {
  sequelize,
  User,
  Form,
  FormField,
  DataEntry,
  DataValue,
  SyncQueue
};