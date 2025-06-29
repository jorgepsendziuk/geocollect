import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  Text,
} from 'react-native';
import MapView, {
  Marker,
  Polygon,
  Polyline,
  Circle,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import {
  FAB,
  Card,
  Button,
  Surface,
  IconButton,
  Menu,
  Chip,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import LocationService from '../services/LocationService';
import DatabaseService from '../services/DatabaseService';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapScreen = ({navigation}) => {
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: -15.7801,
    longitude: -47.8292,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [dataEntries, setDataEntries] = useState([]);
  const [mapType, setMapType] = useState('standard');
  const [showMenu, setShowMenu] = useState(false);
  const [trackingLocation, setTrackingLocation] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filterByForm, setFilterByForm] = useState(null);
  const [forms, setForms] = useState([]);

  useEffect(() => {
    initializeMap();
    loadData();
  }, []);

  const initializeMap = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
      
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      
      setRegion(newRegion);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.log('Could not get current location:', error);
    }
  };

  const loadData = async () => {
    try {
      const entries = await DatabaseService.getDataEntries();
      const entriesWithLocation = entries.filter(
        entry => entry.latitude && entry.longitude
      );
      setDataEntries(entriesWithLocation);

      const formsData = await DatabaseService.getForms();
      setForms(formsData);
    } catch (error) {
      console.error('Error loading map data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do mapa');
    }
  };

  const centerOnCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
      
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA / 4,
        longitudeDelta: LONGITUDE_DELTA / 4,
      };
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter a localização atual');
    }
  };

  const toggleLocationTracking = () => {
    if (trackingLocation) {
      LocationService.stopLocationTracking();
      setTrackingLocation(false);
    } else {
      LocationService.startLocationTracking((location, error) => {
        if (location) {
          setCurrentLocation(location);
          
          if (mapRef.current) {
            const newRegion = {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            };
            mapRef.current.animateToRegion(newRegion, 500);
          }
        } else if (error) {
          console.error('Location tracking error:', error);
        }
      });
      setTrackingLocation(true);
    }
  };

  const getMarkerColor = (entry) => {
    switch (entry.status) {
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

  const handleMarkerPress = (entry) => {
    setSelectedEntry(entry);
  };

  const handleEntryCardPress = (entry) => {
    navigation.navigate('DataCollection', {
      formId: entry.formId,
      entryId: entry.id,
      mode: 'view'
    });
  };

  const getFilteredEntries = () => {
    if (!filterByForm) return dataEntries;
    return dataEntries.filter(entry => entry.formId === filterByForm);
  };

  const getMapTypeText = (type) => {
    switch (type) {
      case 'standard':
        return 'Padrão';
      case 'satellite':
        return 'Satélite';
      case 'hybrid':
        return 'Híbrido';
      case 'terrain':
        return 'Terreno';
      default:
        return 'Padrão';
    }
  };

  const calculateDistance = (entry) => {
    if (!currentLocation) return null;
    
    const distance = LocationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      entry.latitude,
      entry.longitude
    );
    
    return distance < 1000 
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`;
  };

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
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

  const filteredEntries = getFilteredEntries();

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        onRegionChangeComplete={setRegion}>
        
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Sua Localização"
            description={`Precisão: ±${Math.round(currentLocation.accuracy)}m`}
            pinColor="#6200ee"
          />
        )}

        {/* Data Entry Markers */}
        {filteredEntries.map((entry) => (
          <Marker
            key={entry.id}
            coordinate={{
              latitude: parseFloat(entry.latitude),
              longitude: parseFloat(entry.longitude),
            }}
            title={`Registro ${entry.id.slice(0, 8)}`}
            description={formatDate(entry.timestamp)}
            pinColor={getMarkerColor(entry)}
            onPress={() => handleMarkerPress(entry)}
          />
        ))}

        {/* Location accuracy circle for current position */}
        {currentLocation && currentLocation.accuracy && (
          <Circle
            center={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            radius={currentLocation.accuracy}
            strokeColor="rgba(98, 0, 238, 0.5)"
            fillColor="rgba(98, 0, 238, 0.1)"
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        <Surface style={styles.controlsCard}>
          <View style={styles.controlsRow}>
            {/* Map Type Menu */}
            <Menu
              visible={showMenu}
              onDismiss={() => setShowMenu(false)}
              anchor={
                <IconButton
                  icon="layers"
                  size={24}
                  onPress={() => setShowMenu(true)}
                  style={styles.controlButton}
                />
              }>
              <Menu.Item
                title="Padrão"
                onPress={() => {
                  setMapType('standard');
                  setShowMenu(false);
                }}
                leadingIcon={mapType === 'standard' ? 'check' : undefined}
              />
              <Menu.Item
                title="Satélite"
                onPress={() => {
                  setMapType('satellite');
                  setShowMenu(false);
                }}
                leadingIcon={mapType === 'satellite' ? 'check' : undefined}
              />
              <Menu.Item
                title="Híbrido"
                onPress={() => {
                  setMapType('hybrid');
                  setShowMenu(false);
                }}
                leadingIcon={mapType === 'hybrid' ? 'check' : undefined}
              />
              <Menu.Item
                title="Terreno"
                onPress={() => {
                  setMapType('terrain');
                  setShowMenu(false);
                }}
                leadingIcon={mapType === 'terrain' ? 'check' : undefined}
              />
            </Menu>

            {/* Center on location */}
            <IconButton
              icon="my-location"
              size={24}
              onPress={centerOnCurrentLocation}
              style={styles.controlButton}
            />

            {/* Toggle location tracking */}
            <IconButton
              icon={trackingLocation ? 'gps-fixed' : 'gps-not-fixed'}
              size={24}
              iconColor={trackingLocation ? '#4CAF50' : undefined}
              onPress={toggleLocationTracking}
              style={styles.controlButton}
            />
          </View>
        </Surface>
      </View>

      {/* Filter by Form */}
      <View style={styles.filterContainer}>
        <Card style={styles.filterCard}>
          <Card.Content style={styles.filterContent}>
            <Text style={styles.filterLabel}>Filtrar por formulário:</Text>
            <View style={styles.filterChips}>
              <Chip
                selected={!filterByForm}
                onPress={() => setFilterByForm(null)}
                style={styles.filterChip}>
                Todos ({dataEntries.length})
              </Chip>
              {forms.map(form => {
                const count = dataEntries.filter(e => e.formId === form.id).length;
                return (
                  <Chip
                    key={form.id}
                    selected={filterByForm === form.id}
                    onPress={() => setFilterByForm(form.id)}
                    style={styles.filterChip}>
                    {form.title} ({count})
                  </Chip>
                );
              })}
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Selected Entry Details */}
      {selectedEntry && (
        <View style={styles.detailsContainer}>
          <Card style={styles.detailsCard}>
            <Card.Content>
              <View style={styles.detailsHeader}>
                <Text style={styles.detailsTitle}>
                  Registro {selectedEntry.id.slice(0, 8)}
                </Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setSelectedEntry(null)}
                />
              </View>
              
              <View style={styles.detailsRow}>
                <Icon name="schedule" size={16} color="#666" />
                <Text style={styles.detailsText}>
                  {formatDate(selectedEntry.timestamp)}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Icon name="location-on" size={16} color="#666" />
                <Text style={styles.detailsText}>
                  {formatCoordinates(selectedEntry.latitude, selectedEntry.longitude)}
                </Text>
              </View>

              {currentLocation && (
                <View style={styles.detailsRow}>
                  <Icon name="straighten" size={16} color="#666" />
                  <Text style={styles.detailsText}>
                    Distância: {calculateDistance(selectedEntry)}
                  </Text>
                </View>
              )}

              <View style={styles.detailsRow}>
                <Icon name="info" size={16} color={getMarkerColor(selectedEntry)} />
                <Text style={[
                  styles.detailsText,
                  {color: getMarkerColor(selectedEntry)}
                ]}>
                  Status: {selectedEntry.status}
                </Text>
              </View>
            </Card.Content>
            
            <Card.Actions>
              <Button
                mode="contained"
                icon="visibility"
                onPress={() => handleEntryCardPress(selectedEntry)}>
                Ver Detalhes
              </Button>
            </Card.Actions>
          </Card>
        </View>
      )}

      {/* Stats FAB */}
      <FAB
        style={styles.fab}
        icon="analytics"
        label={`${filteredEntries.length}`}
        onPress={() => {
          Alert.alert(
            'Estatísticas do Mapa',
            `Total de registros visíveis: ${filteredEntries.length}\n` +
            `Registros completos: ${filteredEntries.filter(e => e.status === 'completed').length}\n` +
            `Rascunhos: ${filteredEntries.filter(e => e.status === 'draft').length}`
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  controlsCard: {
    borderRadius: 8,
    elevation: 4,
  },
  controlsRow: {
    flexDirection: 'row',
  },
  controlButton: {
    margin: 0,
  },
  filterContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 80,
  },
  filterCard: {
    borderRadius: 8,
    elevation: 2,
  },
  filterContent: {
    paddingVertical: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  detailsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  detailsCard: {
    borderRadius: 8,
    elevation: 4,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default MapScreen;