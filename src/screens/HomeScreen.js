import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Text,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  Surface,
  IconButton,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect} from '@react-navigation/native';

import DatabaseService from '../services/DatabaseService';
import LocationService from '../services/LocationService';
import SyncService from '../services/SyncService';

const HomeScreen = ({navigation}) => {
  const [forms, setForms] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [stats, setStats] = useState({
    totalForms: 0,
    totalEntries: 0,
    pendingSync: 0,
    todayEntries: 0,
  });
  const [location, setLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Load forms
      const formsData = await DatabaseService.getForms();
      setForms(formsData.slice(0, 3)); // Show only first 3 forms on home

      // Load recent data entries
      const entriesData = await DatabaseService.getDataEntries();
      setRecentEntries(entriesData.slice(0, 5)); // Show only recent 5 entries

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = entriesData.filter(entry => 
        entry.createdAt && entry.createdAt.startsWith(today)
      ).length;

      const pendingSync = entriesData.filter(entry => 
        entry.syncStatus === 'pending'
      ).length;

      setStats({
        totalForms: formsData.length,
        totalEntries: entriesData.length,
        pendingSync,
        todayEntries,
      });

      // Get current location
      try {
        const currentLocation = await LocationService.getCurrentLocation();
        setLocation(currentLocation);
      } catch (error) {
        console.log('Location not available:', error);
      }

    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFormPress = (form) => {
    navigation.navigate('DataCollection', {formId: form.id, form});
  };

  const handleSyncPress = async () => {
    try {
      setSyncStatus('syncing');
      await SyncService.syncAll();
      setSyncStatus('completed');
      loadData(); // Refresh data after sync
      
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      Alert.alert('Erro de Sincronização', error.message);
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'sync';
      case 'completed':
        return 'check-circle';
      case 'error':
        return 'error';
      default:
        return 'sync';
    }
  };

  const getSyncColor = () => {
    switch (syncStatus) {
      case 'completed':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#6200ee';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'synced':
        return '#2196F3';
      case 'draft':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completo';
      case 'synced':
        return 'Sincronizado';
      case 'draft':
        return 'Rascunho';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }>
        
        {/* Header with location */}
        <Surface style={styles.headerSurface}>
          <View style={styles.headerContent}>
            <View style={styles.locationInfo}>
              <Icon name="location-on" size={20} color="#6200ee" />
              <Text style={styles.locationText}>
                {location 
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : 'Localização não disponível'
                }
              </Text>
            </View>
            <IconButton
              icon={getSyncIcon()}
              iconColor={getSyncColor()}
              size={24}
              onPress={handleSyncPress}
              disabled={syncStatus === 'syncing'}
            />
          </View>
        </Surface>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="description" size={32} color="#6200ee" />
              <Title style={styles.statNumber}>{stats.totalForms}</Title>
              <Paragraph style={styles.statLabel}>Formulários</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="assignment" size={32} color="#4CAF50" />
              <Title style={styles.statNumber}>{stats.totalEntries}</Title>
              <Paragraph style={styles.statLabel}>Registros</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="today" size={32} color="#FF9800" />
              <Title style={styles.statNumber}>{stats.todayEntries}</Title>
              <Paragraph style={styles.statLabel}>Hoje</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="sync" size={32} color="#F44336" />
              <Title style={styles.statNumber}>{stats.pendingSync}</Title>
              <Paragraph style={styles.statLabel}>Pendentes</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Access Forms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Formulários Recentes</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('FormsTab')}>
              Ver Todos
            </Button>
          </View>

          {forms.length > 0 ? (
            forms.map((form) => (
              <Card key={form.id} style={styles.formCard} onPress={() => handleFormPress(form)}>
                <Card.Content>
                  <View style={styles.formHeader}>
                    <View style={styles.formInfo}>
                      <Title style={styles.formTitle}>{form.title}</Title>
                      {form.description && (
                        <Paragraph style={styles.formDescription}>
                          {form.description}
                        </Paragraph>
                      )}
                    </View>
                    <View style={styles.formBadges}>
                      {form.requireGPS && (
                        <Chip icon="location-on" compact style={styles.requirementChip}>
                          GPS
                        </Chip>
                      )}
                      {form.requirePhotos && (
                        <Chip icon="camera-alt" compact style={styles.requirementChip}>
                          Foto
                        </Chip>
                      )}
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Icon name="description" size={48} color="#BDBDBD" />
                <Paragraph style={styles.emptyText}>
                  Nenhum formulário disponível
                </Paragraph>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('FormsTab')}>
                  Criar Formulário
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Recent Data Entries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Registros Recentes</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('DataEntries')}>
              Ver Todos
            </Button>
          </View>

          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => (
              <Card key={entry.id} style={styles.entryCard}>
                <Card.Content>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryForm}>
                        Formulário: {entry.formId}
                      </Text>
                      <Text style={styles.entryDate}>
                        {formatDate(entry.createdAt)}
                      </Text>
                    </View>
                    <Chip
                      style={[
                        styles.statusChip,
                        {backgroundColor: getStatusColor(entry.status)},
                      ]}
                      textStyle={styles.statusChipText}>
                      {getStatusText(entry.status)}
                    </Chip>
                  </View>
                  {entry.latitude && entry.longitude && (
                    <View style={styles.locationRow}>
                      <Icon name="location-on" size={16} color="#666" />
                      <Text style={styles.coordinatesText}>
                        {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Icon name="assignment" size={48} color="#BDBDBD" />
                <Paragraph style={styles.emptyText}>
                  Nenhum registro encontrado
                </Paragraph>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="add"
        onPress={() => navigation.navigate('FormsTab')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSurface: {
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginBottom: 8,
    marginHorizontal: '1%',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formCard: {
    marginBottom: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  formInfo: {
    flex: 1,
    marginRight: 16,
  },
  formTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  formBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  requirementChip: {
    marginLeft: 4,
    marginBottom: 4,
  },
  entryCard: {
    marginBottom: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryInfo: {
    flex: 1,
  },
  entryForm: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    color: 'white',
    fontSize: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinatesText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  emptyCard: {
    marginBottom: 16,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen;