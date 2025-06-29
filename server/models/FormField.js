module.exports = (sequelize, DataTypes) => {
  const FormField = sequelize.define('FormField', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(
        'text',
        'number',
        'email',
        'phone',
        'textarea',
        'select',
        'multiselect',
        'radio',
        'checkbox',
        'date',
        'time',
        'datetime',
        'photo',
        'file',
        'gps',
        'audio',
        'video',
        'signature',
        'barcode'
      ),
      allowNull: false
    },
    required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    placeholder: {
      type: DataTypes.STRING
    },
    helpText: {
      type: DataTypes.TEXT
    },
    validation: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    options: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    defaultValue: {
      type: DataTypes.TEXT
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    conditions: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'form_fields',
    timestamps: true,
    indexes: [
      {
        fields: ['formId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['order']
      }
    ]
  });

  return FormField;
};