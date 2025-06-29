module.exports = (sequelize, DataTypes) => {
  const DataEntry = sequelize.define('DataEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    formId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'forms',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'completed', 'synced', 'error'),
      defaultValue: 'draft'
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8)
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8)
    },
    accuracy: {
      type: DataTypes.FLOAT
    },
    altitude: {
      type: DataTypes.FLOAT
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE
    },
    syncedAt: {
      type: DataTypes.DATE
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    notes: {
      type: DataTypes.TEXT
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'data_entries',
    timestamps: true,
    indexes: [
      {
        fields: ['formId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['deviceId']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['latitude', 'longitude']
      }
    ]
  });

  return DataEntry;
};