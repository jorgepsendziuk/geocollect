module.exports = (sequelize, DataTypes) => {
  const SyncQueue = sequelize.define('SyncQueue', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entityType: {
      type: DataTypes.ENUM('form', 'data_entry', 'file', 'user_settings'),
      allowNull: false
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    operation: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    lastError: {
      type: DataTypes.TEXT
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    scheduledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    processedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'sync_queue',
    timestamps: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['entityType']
      },
      {
        fields: ['deviceId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['scheduledAt']
      },
      {
        fields: ['priority']
      }
    ]
  });

  return SyncQueue;
};