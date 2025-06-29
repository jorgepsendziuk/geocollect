import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ProgressBar,
  List,
  Divider,
  Chip,
  Surface,
  IconButton,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-netinfo/native-info';

import SyncService from '../services/SyncService';
import DatabaseService from '../services/DatabaseService';

const SyncScreen = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: false,
    isSyncing: false,
    pendingItems: 0,
    failedItems: 0,
    lastSync: null,
  });
  const [syncProgress, setSyncProgress] = useState({
    message: '',
    progress: 0,
  });
  const [syncQueue, setSyncQueue] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    loadSyncStatus();
    loadSyncQueue();
    
    // Subscribe to sync events
    const unsubscribe = SyncService.subscribeToSync(handleSyncEvent);
    
    // Listen for network changes
    const unsubscribeNetInfo = NetInfo.addEventListener(setNetworkInfo);
    
    return () => {
      unsubscribe();
      unsubscribeNetInfo();
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await SyncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const loadSyncQueue = async () => {
    try {
      const queue = await DatabaseService.getSyncQueue();
      setSyncQueue(queue);
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  };

  const handleSyncEvent = (event) => {
    switch (event.type) {
      case 'start':
        setSyncProgress({message: 'Iniciando sincronização...', progress: 0});
        break;
      case 'progress':
        setSyncProgress({message: event.message, progress: event.progress || 0.5});
        break;
      case 'success':
        setSyncProgress({message: 'Sincronização concluída!', progress: 1});
        setTimeout(() => {
          setSyncProgress({message: '', progress: 0});
          loadSyncStatus();
          loadSyncQueue();
        }, 2000);
        break;
      case 'error':
        setSyncProgress({message: `Erro: ${event.error}`, progress: 0});
        setTimeout(() => {
          setSyncProgress({message: '', progress: 0});
          loadSyncStatus();
          loadSyncQueue();
        }, 3000);
        break;
    }
  };

  const handleSyncAll = async () => {
    try {
      await SyncService.syncAll();
    } catch (error) {
      Alert.alert('Erro de Sincronização', error.message);
    }
  };

  const handleRetryFailed = async () => {
    try {
      const retryCount = await SyncService.retryFailedItems();
      if (retryCount === 0) {
        Alert.alert('Info', 'Nenhum item com falha para tentar novamente');
      } else {
        Alert.alert('Info', `Tentando sincronizar ${retryCount} itens novamente`);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tentar novamente os itens com falha');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadSyncStatus();
      await loadSyncQueue();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'processing':
        return 'sync';
      case 'completed':
        return 'check-circle';
      case 'failed':
        return 'error';
      default:
        return 'help';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'processing':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getEntityTypeText = (entityType) => {
    switch (entityType) {
      case 'data_entry':
        return 'Registro de Dados';
      case 'file':
        return 'Arquivo';
      case 'form':
        return 'Formulário';
      case 'user_settings':
        return 'Configurações';
      default:
        return entityType;
    }
  };

  const getOperationText = (operation) => {
    switch (operation) {
      case 'create':
        return 'Criar';
      case 'update':
        return 'Atualizar';
      case 'delete':
        return 'Excluir';
      default:
        return operation;
    }
  };

  const getNetworkStatusColor = () => {
    if (!networkInfo) return '#9E9E9E';
    return networkInfo.isConnected ? '#4CAF50' : '#F44336';
  };

  const getNetworkStatusText = () => {
    if (!networkInfo) return 'Desconhecido';
    if (!networkInfo.isConnected) return 'Sem conexão';
    
    const type = networkInfo.type;
    const effectiveType = networkInfo.details?.effectiveType;
    
    if (type === 'wifi') return 'Wi-Fi';
    if (type === 'cellular') {
      return effectiveType ? `Celular (${effectiveType.toUpperCase()})` : 'Celular';
    }
    
    return 'Conectado';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      
      {/* Connection Status */}
      <Surface style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.connectionInfo}>
            <Icon 
              name={networkInfo?.isConnected ? 'wifi' : 'wifi-off'} 
              size={24} 
              color={getNetworkStatusColor()} 
            />
            <View style={styles.connectionText}>
              <Title style={styles.connectionTitle}>Status da Conexão</Title>
              <Paragraph style={[styles.connectionSubtitle, {color: getNetworkStatusColor()}]}>
                {getNetworkStatusText()}
              </Paragraph>
            </View>
          </View>
          <IconButton
            icon="refresh"
            size={24}
            onPress={handleRefresh}
          />
        </View>
      </Surface>

      {/* Sync Progress */}
      {syncStatus.isSyncing && (
        <Card style={styles.progressCard}>
          <Card.Content>
            <Title style={styles.progressTitle}>Sincronizando...</Title>
            <Paragraph style={styles.progressMessage}>{syncProgress.message}</Paragraph>
            <ProgressBar 
              progress={syncProgress.progress} 
              style={styles.progressBar}
              color="#6200ee"
            />
          </Card.Content>
        </Card>
      )}

      {/* Sync Statistics */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.statsTitle}>Estatísticas de Sincronização</Title>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="schedule" size={32} color="#FF9800" />
              <Title style={styles.statNumber}>{syncStatus.pendingItems}</Title>
              <Paragraph style={styles.statLabel}>Pendentes</Paragraph>
            </View>

            <View style={styles.statItem}>
              <Icon name="error" size={32} color="#F44336" />
              <Title style={styles.statNumber}>{syncStatus.failedItems}</Title>
              <Paragraph style={styles.statLabel}>Com Falha</Paragraph>
            </View>

            <View style={styles.statItem}>
              <Icon name="check-circle" size={32} color="#4CAF50" />
              <Title style={styles.statNumber}>{syncQueue.filter(i => i.status === 'completed').length}</Title>
              <Paragraph style={styles.statLabel}>Completos</Paragraph>
            </View>

            <View style={styles.statItem}>
              <Icon name="sync" size={32} color="#2196F3" />
              <Title style={styles.statNumber}>{syncQueue.length}</Title>
              <Paragraph style={styles.statLabel}>Total</Paragraph>
            </View>
          </View>

          <Divider style={styles.statsDivider} />
          
          <View style={styles.lastSyncInfo}>
            <Icon name="history" size={20} color="#666" />
            <Paragraph style={styles.lastSyncText}>
              Última sincronização: {formatDate(syncStatus.lastSync)}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* Sync Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title style={styles.actionsTitle}>Ações de Sincronização</Title>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon="sync"
              onPress={handleSyncAll}
              disabled={syncStatus.isSyncing || !syncStatus.isOnline}
              style={styles.actionButton}>
              Sincronizar Tudo
            </Button>

            <Button
              mode="outlined"
              icon="refresh"
              onPress={handleRetryFailed}
              disabled={syncStatus.isSyncing || syncStatus.failedItems === 0}
              style={styles.actionButton}>
              Tentar Novamente
            </Button>
          </View>

          {!syncStatus.isOnline && (
            <View style={styles.offlineNotice}>
              <Icon name="wifi-off" size={20} color="#F44336" />
              <Paragraph style={styles.offlineText}>
                Sem conexão com a internet. A sincronização será feita automaticamente quando a conexão for restaurada.
              </Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Sync Queue */}
      <Card style={styles.queueCard}>
        <Card.Content>
          <Title style={styles.queueTitle}>Fila de Sincronização</Title>
          
          {syncQueue.length === 0 ? (
            <View style={styles.emptyQueue}>
              <Icon name="check-circle" size={64} color="#4CAF50" />
              <Paragraph style={styles.emptyQueueText}>
                Nenhum item na fila de sincronização
              </Paragraph>
            </View>
          ) : (
            <View style={styles.queueList}>
              {syncQueue.slice(0, 10).map((item) => (
                <View key={item.id} style={styles.queueItem}>
                  <Icon 
                    name={getStatusIcon(item.status)} 
                    size={24} 
                    color={getStatusColor(item.status)} 
                  />
                  <View style={styles.queueItemContent}>
                    <View style={styles.queueItemHeader}>
                      <Paragraph style={styles.queueItemType}>
                        {getEntityTypeText(item.entityType)}
                      </Paragraph>
                      <Chip 
                        style={[styles.operationChip, {backgroundColor: getStatusColor(item.status)}]}
                        textStyle={styles.operationChipText}>
                        {getOperationText(item.operation)}
                      </Chip>
                    </View>
                    <Paragraph style={styles.queueItemDate}>
                      {formatDate(item.scheduledAt)}
                    </Paragraph>
                    {item.lastError && (
                      <Paragraph style={styles.queueItemError}>
                        {item.lastError}
                      </Paragraph>
                    )}
                  </View>
                </View>
              ))}
              
              {syncQueue.length > 10 && (
                <Paragraph style={styles.moreItemsText}>
                  ... e mais {syncQueue.length - 10} itens
                </Paragraph>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusCard: {
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectionText: {
    marginLeft: 12,
  },
  connectionTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  connectionSubtitle: {
    fontSize: 14,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  progressMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsDivider: {
    marginVertical: 16,
  },
  lastSyncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastSyncText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#C62828',
    flex: 1,
  },
  queueCard: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  queueTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  emptyQueue: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyQueueText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  queueList: {
    // No specific styles needed
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  queueItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  queueItemType: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  operationChip: {
    height: 24,
  },
  operationChipText: {
    color: 'white',
    fontSize: 10,
  },
  queueItemDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  queueItemError: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
  },
  moreItemsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default SyncScreen;