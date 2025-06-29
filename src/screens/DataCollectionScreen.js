import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Text,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  Checkbox,
  RadioButton,
  Surface,
  Chip,
  IconButton,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';
import {Picker} from '@react-native-picker/picker';

import LocationService from '../services/LocationService';
import DatabaseService from '../services/DatabaseService';
import SyncService from '../services/SyncService';

const DataCollectionScreen = ({route, navigation}) => {
  const {form, entryId, mode = 'create'} = route.params;
  const [formData, setFormData] = useState({});
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    initializeForm();
    getCurrentLocation();
  }, []);

  const initializeForm = async () => {
    if (mode === 'edit' && entryId) {
      // Load existing entry data
      const entries = await DatabaseService.getDataEntries();
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        const data = {};
        entry.values.forEach(value => {
          data[value.fieldId] = value.value;
        });
        setFormData(data);
      }
    } else {
      // Initialize with default values
      const data = {};
      form.fields.forEach(field => {
        if (field.defaultValue) {
          data[field.id] = field.defaultValue;
        }
      });
      setFormData(data);
    }
  };

  const getCurrentLocation = async () => {
    if (form.requireGPS) {
      try {
        const currentLocation = await LocationService.getCurrentLocation();
        setLocation(currentLocation);
      } catch (error) {
        Alert.alert(
          'GPS Necessário',
          'Este formulário requer localização GPS. Por favor, ative o GPS e tente novamente.',
          [
            {text: 'Cancelar', onPress: () => navigation.goBack()},
            {text: 'Tentar Novamente', onPress: getCurrentLocation}
          ]
        );
      }
    }
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handlePhotoCapture = (fieldId) => {
    navigation.navigate('Camera', {
      fieldId,
      required: form.fields.find(f => f.id === fieldId)?.required,
      onPhotoCapture: (photoData) => {
        setPhotos(prev => [...prev, {...photoData, fieldId}]);
        handleFieldChange(fieldId, photoData.relativePath);
      }
    });
  };

  const validateForm = () => {
    const errors = [];
    
    form.fields.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id].trim() === '')) {
        errors.push(`${field.label} é obrigatório`);
      }
      
      // Validate field types
      if (formData[field.id]) {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData[field.id])) {
              errors.push(`${field.label} deve ser um email válido`);
            }
            break;
          case 'number':
            if (isNaN(formData[field.id])) {
              errors.push(`${field.label} deve ser um número`);
            }
            break;
        }
      }
    });

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      Alert.alert('Erros de Validação', errors.join('\n'));
      return;
    }

    setIsSubmitting(true);

    try {
      const entryData = {
        id: entryId || undefined,
        formId: form.id,
        userId: 'current-user-id', // Get from auth context
        status: 'completed',
        deviceId: 'device-id',
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
        altitude: location?.altitude,
        timestamp: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        metadata: {
          appVersion: '1.0.0',
          formVersion: form.version,
        },
        attachments: photos,
        values: form.fields.map(field => ({
          fieldId: field.id,
          value: formData[field.id] || null,
          numericValue: field.type === 'number' ? parseFloat(formData[field.id]) : null,
          dateValue: field.type === 'date' ? formData[field.id] : null,
          booleanValue: field.type === 'checkbox' ? Boolean(formData[field.id]) : null,
          arrayValue: field.type === 'multiselect' ? formData[field.id] : null,
          gpsData: field.type === 'gps' ? location : null,
          fileMetadata: field.type === 'photo' ? photos.find(p => p.fieldId === field.id) : null
        }))
      };

      // Save to local database
      const savedEntryId = await DatabaseService.saveDataEntry(entryData);

      // Queue for sync
      await SyncService.queueDataForSync(
        'data_entry',
        savedEntryId,
        mode === 'edit' ? 'update' : 'create',
        entryData,
        'current-user-id'
      );

      Alert.alert(
        'Sucesso',
        'Dados salvos com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('Error saving form data:', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <TextInput
            key={field.id}
            label={field.label}
            value={value}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            placeholder={field.placeholder}
            keyboardType={field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : 'default'}
            style={styles.input}
            error={field.required && !value}
          />
        );

      case 'number':
        return (
          <TextInput
            key={field.id}
            label={field.label}
            value={value}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            placeholder={field.placeholder}
            keyboardType="numeric"
            style={styles.input}
            error={field.required && !value}
          />
        );

      case 'textarea':
        return (
          <TextInput
            key={field.id}
            label={field.label}
            value={value}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            placeholder={field.placeholder}
            multiline
            numberOfLines={4}
            style={styles.input}
            error={field.required && !value}
          />
        );

      case 'select':
        return (
          <View key={field.id} style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>{field.label}</Text>
            <Picker
              selectedValue={value}
              onValueChange={(itemValue) => handleFieldChange(field.id, itemValue)}
              style={styles.picker}>
              <Picker.Item label="Selecione..." value="" />
              {field.options.map((option, index) => (
                <Picker.Item key={index} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        );

      case 'radio':
        return (
          <View key={field.id} style={styles.radioContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <RadioButton.Group
              onValueChange={(selectedValue) => handleFieldChange(field.id, selectedValue)}
              value={value}>
              {field.options.map((option, index) => (
                <View key={index} style={styles.radioOption}>
                  <RadioButton value={option.value} />
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </View>
              ))}
            </RadioButton.Group>
          </View>
        );

      case 'checkbox':
        return (
          <View key={field.id} style={styles.checkboxContainer}>
            <Checkbox
              status={value ? 'checked' : 'unchecked'}
              onPress={() => handleFieldChange(field.id, !value)}
            />
            <Text style={styles.checkboxLabel}>{field.label}</Text>
          </View>
        );

      case 'date':
        return (
          <View key={field.id}>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(field.id)}
              style={styles.dateButton}>
              {value ? new Date(value).toLocaleDateString('pt-BR') : field.label}
            </Button>
            {showDatePicker === field.id && (
              <DatePicker
                modal
                open={true}
                date={value ? new Date(value) : new Date()}
                mode="date"
                onConfirm={(date) => {
                  setShowDatePicker(null);
                  handleFieldChange(field.id, date.toISOString());
                }}
                onCancel={() => setShowDatePicker(null)}
              />
            )}
          </View>
        );

      case 'photo':
        return (
          <View key={field.id} style={styles.photoContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Button
              mode="outlined"
              icon="camera"
              onPress={() => handlePhotoCapture(field.id)}
              style={styles.photoButton}>
              {value ? 'Foto Capturada' : 'Capturar Foto'}
            </Button>
            {photos.find(p => p.fieldId === field.id) && (
              <Chip icon="check" style={styles.photoChip}>
                Foto anexada
              </Chip>
            )}
          </View>
        );

      case 'gps':
        return (
          <View key={field.id} style={styles.gpsContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Surface style={styles.gpsInfo}>
              {location ? (
                <>
                  <View style={styles.gpsRow}>
                    <Icon name="location-on" size={20} color="#4CAF50" />
                    <Text style={styles.gpsText}>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                  </View>
                  <Text style={styles.gpsAccuracy}>
                    Precisão: ±{Math.round(location.accuracy)}m
                  </Text>
                </>
              ) : (
                <Text style={styles.gpsLoading}>Obtendo localização...</Text>
              )}
            </Surface>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Title style={styles.formTitle}>{form.title}</Title>
          {form.description && (
            <Text style={styles.formDescription}>{form.description}</Text>
          )}
          
          {location && (
            <Surface style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <Icon name="location-on" size={20} color="#4CAF50" />
                <Text style={styles.locationText}>
                  GPS: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              </View>
            </Surface>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.fieldsCard}>
        <Card.Content>
          <Title style={styles.fieldsTitle}>Dados do Formulário</Title>
          
          {form.fields.map(field => (
            <View key={field.id} style={styles.fieldContainer}>
              {renderField(field)}
              {field.helpText && (
                <Text style={styles.helpText}>{field.helpText}</Text>
              )}
            </View>
          ))}
        </Card.Content>
      </Card>

      <View style={styles.actionContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.actionButton}
          disabled={isSubmitting}>
          Cancelar
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.actionButton}
          loading={isSubmitting}
          disabled={isSubmitting}>
          {mode === 'edit' ? 'Atualizar' : 'Salvar'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formCard: {
    margin: 16,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  locationCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E8F5E8',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2E7D32',
  },
  fieldsCard: {
    margin: 16,
    marginBottom: 8,
  },
  fieldsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  radioContainer: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  dateButton: {
    marginBottom: 16,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photoButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  photoChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
  },
  gpsContainer: {
    marginBottom: 16,
  },
  gpsInfo: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gpsText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  gpsAccuracy: {
    fontSize: 12,
    color: '#666',
    marginLeft: 28,
  },
  gpsLoading: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default DataCollectionScreen;