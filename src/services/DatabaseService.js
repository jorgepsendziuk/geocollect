import SQLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

class DatabaseService {
  constructor() {
    this.database = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.database = await SQLite.openDatabase({
        name: 'geocollect.db',
        location: 'default',
      });

      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS forms (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        version TEXT DEFAULT '1.0.0',
        isActive INTEGER DEFAULT 1,
        settings TEXT DEFAULT '{}',
        createdBy TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        category TEXT,
        allowOffline INTEGER DEFAULT 1,
        requireGPS INTEGER DEFAULT 0,
        requirePhotos INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        syncStatus TEXT DEFAULT 'synced'
      )`,
      
      `CREATE TABLE IF NOT EXISTS form_fields (
        id TEXT PRIMARY KEY,
        formId TEXT NOT NULL,
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        required INTEGER DEFAULT 0,
        placeholder TEXT,
        helpText TEXT,
        validation TEXT DEFAULT '{}',
        options TEXT DEFAULT '[]',
        defaultValue TEXT,
        fieldOrder INTEGER DEFAULT 0,
        settings TEXT DEFAULT '{}',
        conditions TEXT DEFAULT '{}',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (formId) REFERENCES forms (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS data_entries (
        id TEXT PRIMARY KEY,
        formId TEXT NOT NULL,
        userId TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        deviceId TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        accuracy REAL,
        altitude REAL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        completedAt TEXT,
        syncedAt TEXT,
        metadata TEXT DEFAULT '{}',
        notes TEXT,
        attachments TEXT DEFAULT '[]',
        version INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        syncStatus TEXT DEFAULT 'pending',
        FOREIGN KEY (formId) REFERENCES forms (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS data_values (
        id TEXT PRIMARY KEY,
        dataEntryId TEXT NOT NULL,
        fieldId TEXT NOT NULL,
        value TEXT,
        numericValue REAL,
        dateValue TEXT,
        booleanValue INTEGER,
        arrayValue TEXT,
        fileMetadata TEXT,
        gpsData TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dataEntryId) REFERENCES data_entries (id),
        FOREIGN KEY (fieldId) REFERENCES form_fields (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        retryCount INTEGER DEFAULT 0,
        maxRetries INTEGER DEFAULT 3,
        lastError TEXT,
        deviceId TEXT NOT NULL,
        userId TEXT,
        priority INTEGER DEFAULT 1,
        scheduledAt TEXT DEFAULT CURRENT_TIMESTAMP,
        processedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE INDEX IF NOT EXISTS idx_forms_active ON forms (isActive)`,
      `CREATE INDEX IF NOT EXISTS idx_form_fields_form ON form_fields (formId)`,
      `CREATE INDEX IF NOT EXISTS idx_data_entries_form ON data_entries (formId)`,
      `CREATE INDEX IF NOT EXISTS idx_data_entries_status ON data_entries (status)`,
      `CREATE INDEX IF NOT EXISTS idx_data_entries_sync ON data_entries (syncStatus)`,
      `CREATE INDEX IF NOT EXISTS idx_data_values_entry ON data_values (dataEntryId)`,
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status)`
    ];

    for (const query of queries) {
      await this.database.executeSql(query);
    }
  }

  // Forms CRUD operations
  async saveForms(forms) {
    const insertQuery = `
      INSERT OR REPLACE INTO forms 
      (id, title, description, version, isActive, settings, createdBy, tags, category, allowOffline, requireGPS, requirePhotos, createdAt, updatedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const form of forms) {
      await this.database.executeSql(insertQuery, [
        form.id,
        form.title,
        form.description,
        form.version,
        form.isActive ? 1 : 0,
        JSON.stringify(form.settings || {}),
        form.createdBy,
        JSON.stringify(form.tags || []),
        form.category,
        form.allowOffline ? 1 : 0,
        form.requireGPS ? 1 : 0,
        form.requirePhotos ? 1 : 0,
        form.createdAt,
        form.updatedAt,
        'synced'
      ]);

      // Save form fields
      if (form.fields && form.fields.length > 0) {
        await this.saveFormFields(form.fields);
      }
    }
  }

  async saveFormFields(fields) {
    const insertQuery = `
      INSERT OR REPLACE INTO form_fields 
      (id, formId, name, label, type, required, placeholder, helpText, validation, options, defaultValue, fieldOrder, settings, conditions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const field of fields) {
      await this.database.executeSql(insertQuery, [
        field.id,
        field.formId,
        field.name,
        field.label,
        field.type,
        field.required ? 1 : 0,
        field.placeholder,
        field.helpText,
        JSON.stringify(field.validation || {}),
        JSON.stringify(field.options || []),
        field.defaultValue,
        field.order,
        JSON.stringify(field.settings || {}),
        JSON.stringify(field.conditions || {}),
        field.createdAt,
        field.updatedAt
      ]);
    }
  }

  async getForms() {
    const [results] = await this.database.executeSql('SELECT * FROM forms WHERE isActive = 1 ORDER BY updatedAt DESC');
    const forms = [];
    
    for (let i = 0; i < results.rows.length; i++) {
      const form = results.rows.item(i);
      const fields = await this.getFormFields(form.id);
      
      forms.push({
        ...form,
        isActive: Boolean(form.isActive),
        allowOffline: Boolean(form.allowOffline),
        requireGPS: Boolean(form.requireGPS),
        requirePhotos: Boolean(form.requirePhotos),
        settings: JSON.parse(form.settings || '{}'),
        tags: JSON.parse(form.tags || '[]'),
        fields
      });
    }
    
    return forms;
  }

  async getFormFields(formId) {
    const [results] = await this.database.executeSql(
      'SELECT * FROM form_fields WHERE formId = ? ORDER BY fieldOrder ASC',
      [formId]
    );
    
    const fields = [];
    for (let i = 0; i < results.rows.length; i++) {
      const field = results.rows.item(i);
      fields.push({
        ...field,
        required: Boolean(field.required),
        validation: JSON.parse(field.validation || '{}'),
        options: JSON.parse(field.options || '[]'),
        settings: JSON.parse(field.settings || '{}'),
        conditions: JSON.parse(field.conditions || '{}'),
        order: field.fieldOrder
      });
    }
    
    return fields;
  }

  // Data Entry CRUD operations
  async saveDataEntry(dataEntry) {
    const id = dataEntry.id || uuidv4();
    const insertQuery = `
      INSERT OR REPLACE INTO data_entries 
      (id, formId, userId, status, deviceId, latitude, longitude, accuracy, altitude, timestamp, completedAt, syncedAt, metadata, notes, attachments, version, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.database.executeSql(insertQuery, [
      id,
      dataEntry.formId,
      dataEntry.userId,
      dataEntry.status || 'draft',
      dataEntry.deviceId,
      dataEntry.latitude,
      dataEntry.longitude,
      dataEntry.accuracy,
      dataEntry.altitude,
      dataEntry.timestamp || new Date().toISOString(),
      dataEntry.completedAt,
      dataEntry.syncedAt,
      JSON.stringify(dataEntry.metadata || {}),
      dataEntry.notes,
      JSON.stringify(dataEntry.attachments || []),
      dataEntry.version || 1,
      dataEntry.syncStatus || 'pending'
    ]);

    // Save data values
    if (dataEntry.values && dataEntry.values.length > 0) {
      await this.saveDataValues(id, dataEntry.values);
    }

    return id;
  }

  async saveDataValues(dataEntryId, values) {
    const insertQuery = `
      INSERT OR REPLACE INTO data_values 
      (id, dataEntryId, fieldId, value, numericValue, dateValue, booleanValue, arrayValue, fileMetadata, gpsData)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const value of values) {
      await this.database.executeSql(insertQuery, [
        value.id || uuidv4(),
        dataEntryId,
        value.fieldId,
        value.value,
        value.numericValue,
        value.dateValue,
        value.booleanValue ? 1 : 0,
        JSON.stringify(value.arrayValue),
        JSON.stringify(value.fileMetadata),
        JSON.stringify(value.gpsData)
      ]);
    }
  }

  async getDataEntries(formId = null) {
    let query = 'SELECT * FROM data_entries ORDER BY updatedAt DESC';
    let params = [];
    
    if (formId) {
      query = 'SELECT * FROM data_entries WHERE formId = ? ORDER BY updatedAt DESC';
      params = [formId];
    }

    const [results] = await this.database.executeSql(query, params);
    const entries = [];
    
    for (let i = 0; i < results.rows.length; i++) {
      const entry = results.rows.item(i);
      const values = await this.getDataValues(entry.id);
      
      entries.push({
        ...entry,
        metadata: JSON.parse(entry.metadata || '{}'),
        attachments: JSON.parse(entry.attachments || '[]'),
        values
      });
    }
    
    return entries;
  }

  async getDataValues(dataEntryId) {
    const [results] = await this.database.executeSql(
      'SELECT * FROM data_values WHERE dataEntryId = ?',
      [dataEntryId]
    );
    
    const values = [];
    for (let i = 0; i < results.rows.length; i++) {
      const value = results.rows.item(i);
      values.push({
        ...value,
        booleanValue: Boolean(value.booleanValue),
        arrayValue: JSON.parse(value.arrayValue || 'null'),
        fileMetadata: JSON.parse(value.fileMetadata || 'null'),
        gpsData: JSON.parse(value.gpsData || 'null')
      });
    }
    
    return values;
  }

  // Sync queue operations
  async addToSyncQueue(entityType, entityId, operation, data, userId) {
    const deviceId = await AsyncStorage.getItem('deviceId') || 'unknown';
    const insertQuery = `
      INSERT INTO sync_queue (id, entityType, entityId, operation, data, deviceId, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const id = uuidv4();
    await this.database.executeSql(insertQuery, [
      id,
      entityType,
      entityId,
      operation,
      JSON.stringify(data),
      deviceId,
      userId
    ]);

    return id;
  }

  async getSyncQueue() {
    const [results] = await this.database.executeSql(
      'SELECT * FROM sync_queue WHERE status = ? ORDER BY priority DESC, scheduledAt ASC',
      ['pending']
    );
    
    const items = [];
    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      items.push({
        ...item,
        data: JSON.parse(item.data)
      });
    }
    
    return items;
  }

  async updateSyncStatus(id, status, error = null) {
    const updateQuery = `
      UPDATE sync_queue 
      SET status = ?, lastError = ?, processedAt = ?, retryCount = retryCount + 1
      WHERE id = ?
    `;

    await this.database.executeSql(updateQuery, [
      status,
      error,
      new Date().toISOString(),
      id
    ]);
  }
}

export default new DatabaseService();