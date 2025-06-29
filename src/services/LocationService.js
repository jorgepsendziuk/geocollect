import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationService {
  constructor() {
    this.isInitialized = false;
    this.currentLocation = null;
    this.watchId = null;
    this.locationSubscribers = [];
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const hasPermission = await this.requestLocationPermission();
      if (hasPermission) {
        this.isInitialized = true;
        console.log('Location service initialized successfully');
      } else {
        throw new Error('Location permission denied');
      }
    } catch (error) {
      console.error('Location service initialization failed:', error);
      throw error;
    }
  }

  async requestLocationPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permissão de Localização',
            message: 'GeoCOLLECT precisa acessar sua localização para coletar dados geográficos.',
            buttonNeutral: 'Perguntar Depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          }
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Error requesting location permission:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  }

  async getCurrentLocation(highAccuracy = true, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: highAccuracy,
        timeout: timeout,
        maximumAge: 10000,
      };

      Geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };

          this.currentLocation = location;
          this.notifySubscribers(location);
          resolve(location);
        },
        (error) => {
          console.error('Error getting current location:', error);
          reject(this.handleLocationError(error));
        },
        options
      );
    });
  }

  startLocationTracking(callback, options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      distanceFilter: 10,
      interval: 5000,
      fastestInterval: 2000,
    };

    const trackingOptions = { ...defaultOptions, ...options };

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        this.currentLocation = location;
        this.notifySubscribers(location);
        
        if (callback) {
          callback(location);
        }
      },
      (error) => {
        console.error('Error tracking location:', error);
        const errorMessage = this.handleLocationError(error);
        if (callback) {
          callback(null, errorMessage);
        }
      },
      trackingOptions
    );

    return this.watchId;
  }

  stopLocationTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  subscribeToLocationUpdates(callback) {
    this.locationSubscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.locationSubscribers.indexOf(callback);
      if (index > -1) {
        this.locationSubscribers.splice(index, 1);
      }
    };
  }

  notifySubscribers(location) {
    this.locationSubscribers.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location subscriber:', error);
      }
    });
  }

  handleLocationError(error) {
    let errorMessage = 'Erro desconhecido ao obter localização';

    switch (error.code) {
      case 1:
        errorMessage = 'Permissão de localização negada';
        break;
      case 2:
        errorMessage = 'Localização indisponível';
        break;
      case 3:
        errorMessage = 'Timeout ao obter localização';
        break;
      case 4:
        errorMessage = 'Google Play Services indisponível';
        break;
      case 5:
        errorMessage = 'Erro interno de localização';
        break;
    }

    return { code: error.code, message: errorMessage };
  }

  async getLocationAccuracy() {
    try {
      const location = await this.getCurrentLocation(true, 30000);
      return {
        accuracy: location.accuracy,
        isHighAccuracy: location.accuracy <= 10,
        message: location.accuracy <= 10 ? 'Alta precisão' : 
                 location.accuracy <= 50 ? 'Precisão média' : 'Baixa precisão'
      };
    } catch (error) {
      return {
        accuracy: null,
        isHighAccuracy: false,
        message: 'Não foi possível determinar a precisão'
      };
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance * 1000; // Convert to meters
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  async saveLocationSettings(settings) {
    await AsyncStorage.setItem('locationSettings', JSON.stringify(settings));
  }

  async getLocationSettings() {
    try {
      const settings = await AsyncStorage.getItem('locationSettings');
      return settings ? JSON.parse(settings) : {
        enableHighAccuracy: true,
        enableBackground: false,
        updateInterval: 5000,
        minDistance: 10
      };
    } catch (error) {
      console.error('Error getting location settings:', error);
      return {
        enableHighAccuracy: true,
        enableBackground: false,
        updateInterval: 5000,
        minDistance: 10
      };
    }
  }

  formatCoordinates(latitude, longitude, format = 'decimal') {
    switch (format) {
      case 'dms':
        return {
          latitude: this.toDMS(latitude, true),
          longitude: this.toDMS(longitude, false)
        };
      case 'utm':
        return this.toUTM(latitude, longitude);
      default:
        return {
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6))
        };
    }
  }

  toDMS(coordinate, isLatitude) {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = (minutesNotTruncated - minutes) * 60;

    const direction = isLatitude 
      ? (coordinate >= 0 ? 'N' : 'S')
      : (coordinate >= 0 ? 'E' : 'W');

    return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${direction}`;
  }

  toUTM(latitude, longitude) {
    // Simplified UTM conversion - for production use a proper library
    const zone = Math.floor((longitude + 180) / 6) + 1;
    const hemisphere = latitude >= 0 ? 'N' : 'S';
    
    return {
      zone: zone + hemisphere,
      easting: Math.round(500000 + (longitude * 111320)),
      northing: Math.round(latitude * 110540)
    };
  }
}

export default new LocationService();