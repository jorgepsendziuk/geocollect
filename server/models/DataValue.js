module.exports = (sequelize, DataTypes) => {
  const DataValue = sequelize.define('DataValue', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    dataEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'data_entries',
        key: 'id'
      }
    },
    fieldId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'form_fields',
        key: 'id'
      }
    },
    value: {
      type: DataTypes.TEXT
    },
    numericValue: {
      type: DataTypes.DECIMAL(15, 6)
    },
    dateValue: {
      type: DataTypes.DATE
    },
    booleanValue: {
      type: DataTypes.BOOLEAN
    },
    arrayValue: {
      type: DataTypes.JSONB
    },
    fileMetadata: {
      type: DataTypes.JSONB
    },
    gpsData: {
      type: DataTypes.JSONB
    }
  }, {
    tableName: 'data_values',
    timestamps: true,
    indexes: [
      {
        fields: ['dataEntryId']
      },
      {
        fields: ['fieldId']
      },
      {
        fields: ['numericValue']
      },
      {
        fields: ['dateValue']
      }
    ]
  });

  return DataValue;
};