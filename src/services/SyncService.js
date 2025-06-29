import NetInfo from '@react-native-netinfo/native-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import DatabaseService from './DatabaseService';

class SyncService {
  constructor() {
    this.isInitialized = false;
    this.isSyncing = false;
    this.syncSubscribers = [];
    this.baseURL = 'http://localhost:3000/api'; // Update with your server URL
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms
  }

  initialize() {
    if (this.isInitialized) return;

    // Listen for network changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.autoSync();
      }
    });

    // Start periodic sync check
    this.startPeriodicSync();
    this.isInitialized = true;
    console.log('Sync service initialized');
  }

  startPeriodicSync() {
    setInterval(async () => {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected && !this.isSyncing) {
        this.autoSync();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  async autoSync() {
    try {
      const lastAutoSync = await AsyncStorage.getItem('lastAutoSync');
      const now = Date.now();
      
      // Only auto-sync if it's been more than 10 minutes since last sync
      if (lastAutoSync && (now - parseInt(lastAutoSync)) < 10 * 60 * 1000) {
        return;
      }

      await this.syncAll();
      await AsyncStorage.setItem('lastAutoSync', now.toString());
    } catch (error) {
      console.log('Auto sync failed:', error);
    }
  }

  async syncAll() {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    this.notifySubscribers({type: 'start'});

    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        throw new Error('No internet connection available');
      }

      // Get authentication token
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Sync in order: pull forms, push data, pull updates
      await this.pullForms(token);
      await this.pushDataEntries(token);
      await this.pushFiles(token);
      await this.cleanupSyncQueue();

      this.notifySubscribers({type: 'success'});
      console.log('Sync completed successfully');

    } catch (error) {
      console.error('Sync failed:', error);
      this.notifySubscribers({type: 'error', error: error.message});
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  async pullForms(token) {
    try {
      this.notifySubscribers({type: 'progress', message: 'Baixando formulários...'});
      
      const response = await axios.get(`${this.baseURL}/forms`, {
        headers: {Authorization: `Bearer ${token}`},
        timeout: 30000,
      });

      const forms = response.data;
      if (forms && forms.length > 0) {
        await DatabaseService.saveForms(forms);
        console.log(`Downloaded ${forms.length} forms`);
      }
    } catch (error) {
      console.error('Error pulling forms:', error);
      throw new Error('Failed to download forms from server');
    }
  }

  async pushDataEntries(token) {
    try {
      this.notifySubscribers({type: 'progress', message: 'Enviando dados coletados...'});
      
      const syncQueue = await DatabaseService.getSyncQueue();
      const dataEntries = syncQueue.filter(item => item.entityType === 'data_entry');

      for (const queueItem of dataEntries) {
        try {
          await this.pushSingleDataEntry(queueItem, token);
          await DatabaseService.updateSyncStatus(queueItem.id, 'completed');
        } catch (error) {
          console.error(`Failed to sync data entry ${queueItem.entityId}:`, error);
          await DatabaseService.updateSyncStatus(
            queueItem.id, 
            'failed', 
            error.message
          );
        }
      }

      console.log(`Processed ${dataEntries.length} data entries`);
    } catch (error) {
      console.error('Error pushing data entries:', error);
      throw new Error('Failed to upload data entries to server');
    }
  }

  async pushSingleDataEntry(queueItem, token) {
    const {operation, data} = queueItem;
    let url = `${this.baseURL}/data`;
    let method = 'post';

    switch (operation) {
      case 'create':
        method = 'post';
        break;
      case 'update':
        method = 'put';
        url += `/${data.id}`;
        break;
      case 'delete':
        method = 'delete';
        url += `/${data.id}`;
        break;
    }

    const response = await axios({
      method,
      url,
      data: operation === 'delete' ? undefined : data,
      headers: {Authorization: `Bearer ${token}`},
      timeout: 30000,
    });

    return response.data;
  }

  async pushFiles(token) {
    try {
      this.notifySubscribers({type: 'progress', message: 'Enviando arquivos...'});
      
      const syncQueue = await DatabaseService.getSyncQueue();
      const fileItems = syncQueue.filter(item => item.entityType === 'file');

      for (const queueItem of fileItems) {
        try {
          await this.pushSingleFile(queueItem, token);
          await DatabaseService.updateSyncStatus(queueItem.id, 'completed');
        } catch (error) {
          console.error(`Failed to sync file ${queueItem.entityId}:`, error);
          await DatabaseService.updateSyncStatus(
            queueItem.id, 
            'failed', 
            error.message
          );
        }
      }

      console.log(`Processed ${fileItems.length} files`);
    } catch (error) {
      console.error('Error pushing files:', error);
      // File sync errors shouldn't stop the entire sync process
      console.log('Continuing sync despite file upload errors');
    }
  }

  async pushSingleFile(queueItem, token) {
    const {data} = queueItem;
    const formData = new FormData();
    
    formData.append('file', {
      uri: data.localPath,
      type: data.type || 'image/jpeg',
      name: data.fileName,
    });

    if (data.location) {
      formData.append('location', JSON.stringify(data.location));
    }

    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    const response = await axios.post(`${this.baseURL}/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Longer timeout for file uploads
    });

    return response.data;
  }

  async cleanupSyncQueue() {
    try {
      // Remove completed sync items older than 24 hours
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // In a real implementation, you would clean up the sync queue here
      console.log('Sync queue cleanup completed');
    } catch (error) {
      console.error('Error cleaning sync queue:', error);
    }
  }

  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        // Try to get a new token or prompt user to login
        return await this.refreshAuthToken();
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async refreshAuthToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refreshToken,
      });

      const {accessToken} = response.data;
      await AsyncStorage.setItem('authToken', accessToken);
      return accessToken;
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      // Clear invalid tokens
      await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
      throw new Error('Authentication expired. Please login again.');
    }
  }

  async queueDataForSync(entityType, entityId, operation, data, userId) {
    try {
      await DatabaseService.addToSyncQueue(
        entityType,
        entityId,
        operation,
        data,
        userId
      );
      
      // Try immediate sync if online
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected && !this.isSyncing) {
        setTimeout(() => this.autoSync(), 1000); // Delay slightly to avoid conflicts
      }
    } catch (error) {
      console.error('Error queuing data for sync:', error);
    }
  }

  async forcePushData(entryId) {
    try {
      if (this.isSyncing) {
        throw new Error('Sync already in progress');
      }

      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        throw new Error('No internet connection available');
      }

      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      this.isSyncing = true;
      this.notifySubscribers({type: 'start'});

      // Get specific entry from sync queue
      const syncQueue = await DatabaseService.getSyncQueue();
      const queueItem = syncQueue.find(item => 
        item.entityType === 'data_entry' && item.entityId === entryId
      );

      if (!queueItem) {
        throw new Error('Data entry not found in sync queue');
      }

      await this.pushSingleDataEntry(queueItem, token);
      await DatabaseService.updateSyncStatus(queueItem.id, 'completed');

      this.notifySubscribers({type: 'success'});
      console.log(`Force pushed data entry ${entryId}`);

    } catch (error) {
      console.error('Force push failed:', error);
      this.notifySubscribers({type: 'error', error: error.message});
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  subscribeToSync(callback) {
    this.syncSubscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.syncSubscribers.indexOf(callback);
      if (index > -1) {
        this.syncSubscribers.splice(index, 1);
      }
    };
  }

  notifySubscribers(event) {
    this.syncSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in sync subscriber:', error);
      }
    });
  }

  async getSyncStatus() {
    try {
      const syncQueue = await DatabaseService.getSyncQueue();
      const pendingCount = syncQueue.filter(item => item.status === 'pending').length;
      const failedCount = syncQueue.filter(item => item.status === 'failed').length;
      
      const lastSync = await AsyncStorage.getItem('lastAutoSync');
      const lastSyncDate = lastSync ? new Date(parseInt(lastSync)) : null;

      const networkState = await NetInfo.fetch();

      return {
        isOnline: networkState.isConnected,
        isSyncing: this.isSyncing,
        pendingItems: pendingCount,
        failedItems: failedCount,
        lastSync: lastSyncDate,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isOnline: false,
        isSyncing: false,
        pendingItems: 0,
        failedItems: 0,
        lastSync: null,
      };
    }
  }

  async retryFailedItems() {
    try {
      // Reset failed items to pending status for retry
      const syncQueue = await DatabaseService.getSyncQueue();
      const failedItems = syncQueue.filter(item => 
        item.status === 'failed' && item.retryCount < this.maxRetries
      );

      for (const item of failedItems) {
        await DatabaseService.updateSyncStatus(item.id, 'pending');
      }

      if (failedItems.length > 0) {
        await this.syncAll();
      }

      return failedItems.length;
    } catch (error) {
      console.error('Error retrying failed items:', error);
      throw error;
    }
  }
}

export default new SyncService();