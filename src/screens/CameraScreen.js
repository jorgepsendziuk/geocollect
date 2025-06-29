import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Button,
  Card,
  IconButton,
  Surface,
  Title,
  Paragraph,
} from 'react-native-paper';
import {launchImageLibrary, launchCamera, MediaType} from 'react-native-image-picker';
import {PermissionsAndroid} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';

import LocationService from '../services/LocationService';

const CameraScreen = ({navigation, route}) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const {onPhotoCapture, fieldId, required = false} = route.params || {};

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await LocationService.getCurrentLocation();
      setLocation(currentLocation);
    } catch (error) {
      console.log('Location not available:', error);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permissão da Câmera',
            message: 'GeoCOLLECT precisa acessar sua câmera para capturar fotos.',
            buttonNeutral: 'Perguntar Depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Error requesting camera permission:', err);
        return false;
      }
    }
    return true;
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Erro', 'Permissão da câmera é necessária para capturar fotos');
      return;
    }

    setIsCapturing(true);

    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchCamera(options, async (response) => {
      setIsCapturing(false);
      
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        Alert.alert('Erro', `Erro ao capturar foto: ${response.errorMessage}`);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const photo = response.assets[0];
        await processPhoto(photo);
      }
    });
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        Alert.alert('Erro', `Erro ao selecionar foto: ${response.errorMessage}`);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const photo = response.assets[0];
        await processPhoto(photo);
      }
    });
  };

  const processPhoto = async (photo) => {
    try {
      // Get current location if not already available
      let currentLocation = location;
      if (!currentLocation) {
        try {
          currentLocation = await LocationService.getCurrentLocation();
          setLocation(currentLocation);
        } catch (error) {
          console.log('Could not get location for photo');
        }
      }

      // Create photo metadata
      const photoData = {
        uri: photo.uri,
        fileName: photo.fileName || `photo_${Date.now()}.jpg`,
        type: photo.type || 'image/jpeg',
        fileSize: photo.fileSize,
        width: photo.width,
        height: photo.height,
        timestamp: new Date().toISOString(),
        location: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          altitude: currentLocation.altitude,
        } : null,
      };

      setCapturedImage(photoData);
    } catch (error) {
      console.error('Error processing photo:', error);
      Alert.alert('Erro', 'Erro ao processar a foto capturada');
    }
  };

  const savePhoto = async () => {
    if (!capturedImage) return;

    try {
      // Create a unique filename
      const fileName = `${Date.now()}_${capturedImage.fileName}`;
      const destPath = `${RNFS.DocumentDirectoryPath}/photos/${fileName}`;

      // Ensure photos directory exists
      const photosDir = `${RNFS.DocumentDirectoryPath}/photos`;
      const dirExists = await RNFS.exists(photosDir);
      if (!dirExists) {
        await RNFS.mkdir(photosDir);
      }

      // Copy file to app directory
      await RNFS.copyFile(capturedImage.uri, destPath);

      // Create final photo data
      const finalPhotoData = {
        ...capturedImage,
        localPath: destPath,
        relativePath: `photos/${fileName}`,
        saved: true,
      };

      // Call the callback if provided
      if (onPhotoCapture) {
        onPhotoCapture(finalPhotoData);
      }

      Alert.alert(
        'Foto Salva',
        'A foto foi salva com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Erro', 'Não foi possível salvar a foto');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const formatLocation = (loc) => {
    if (!loc) return 'Localização não disponível';
    return `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`;
  };

  const formatAccuracy = (accuracy) => {
    if (!accuracy) return 'N/A';
    return `±${Math.round(accuracy)}m`;
  };

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{uri: capturedImage.uri}} style={styles.previewImage} />
          
          <Surface style={styles.metadataCard}>
            <View style={styles.metadataContent}>
              <Text style={styles.metadataTitle}>Informações da Foto</Text>
              
              <View style={styles.metadataRow}>
                <Icon name="schedule" size={16} color="#666" />
                <Text style={styles.metadataText}>
                  {new Date(capturedImage.timestamp).toLocaleString('pt-BR')}
                </Text>
              </View>

              {capturedImage.location && (
                <>
                  <View style={styles.metadataRow}>
                    <Icon name="location-on" size={16} color="#666" />
                    <Text style={styles.metadataText}>
                      {formatLocation(capturedImage.location)}
                    </Text>
                  </View>
                  
                  <View style={styles.metadataRow}>
                    <Icon name="gps-fixed" size={16} color="#666" />
                    <Text style={styles.metadataText}>
                      Precisão: {formatAccuracy(capturedImage.location.accuracy)}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.metadataRow}>
                <Icon name="photo-size-select-actual" size={16} color="#666" />
                <Text style={styles.metadataText}>
                  {capturedImage.width} × {capturedImage.height}
                </Text>
              </View>

              {capturedImage.fileSize && (
                <View style={styles.metadataRow}>
                  <Icon name="storage" size={16} color="#666" />
                  <Text style={styles.metadataText}>
                    {(capturedImage.fileSize / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </View>
              )}
            </View>
          </Surface>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            icon="refresh"
            onPress={retakePhoto}
            style={styles.actionButton}>
            Refazer
          </Button>
          
          <Button
            mode="contained"
            icon="save"
            onPress={savePhoto}
            style={styles.actionButton}>
            Salvar Foto
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Card style={styles.instructionCard}>
          <Card.Content>
            <Title style={styles.instructionTitle}>Capturar Foto</Title>
            <Paragraph style={styles.instructionText}>
              Escolha uma das opções abaixo para capturar ou selecionar uma foto.
              {location && ' A localização GPS será automaticamente incluída.'}
            </Paragraph>
            
            {location && (
              <View style={styles.locationInfo}>
                <Icon name="location-on" size={20} color="#4CAF50" />
                <Text style={styles.locationText}>
                  GPS: {formatLocation(location)} ({formatAccuracy(location.accuracy)})
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </View>

      <View style={styles.captureContainer}>
        <TouchableOpacity
          style={styles.captureOption}
          onPress={openCamera}
          disabled={isCapturing}>
          <Surface style={styles.captureButton}>
            <Icon name="camera-alt" size={48} color="#6200ee" />
            <Text style={styles.captureButtonText}>Tirar Foto</Text>
            <Text style={styles.captureButtonSubtext}>
              Usar câmera do dispositivo
            </Text>
          </Surface>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureOption}
          onPress={openImageLibrary}>
          <Surface style={styles.captureButton}>
            <Icon name="photo-library" size={48} color="#6200ee" />
            <Text style={styles.captureButtonText}>Selecionar da Galeria</Text>
            <Text style={styles.captureButtonSubtext}>
              Escolher foto existente
            </Text>
          </Surface>
        </TouchableOpacity>
      </View>

      {required && (
        <View style={styles.requiredNotice}>
          <Icon name="info" size={20} color="#FF9800" />
          <Text style={styles.requiredText}>Esta foto é obrigatória</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 16,
  },
  instructionCard: {
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#2E7D32',
    flex: 1,
  },
  captureContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  captureOption: {
    marginBottom: 16,
  },
  captureButton: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 12,
    elevation: 2,
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  captureButtonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  requiredNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF3E0',
  },
  requiredText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#F57C00',
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  metadataCard: {
    margin: 16,
    borderRadius: 8,
  },
  metadataContent: {
    padding: 16,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default CameraScreen;