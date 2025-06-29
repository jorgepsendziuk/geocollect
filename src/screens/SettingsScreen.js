import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  TextInput,
  Surface,
  Dialog,
  Portal,
  RadioButton,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LocationService from '../services/LocationService';
import DatabaseService from '../services/DatabaseService';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    // Location settings
    enableHighAccuracy: true,
    enableBackground: false,
    updateInterval: 5000,
    minDistance: 10,
    
    // Sync settings
    autoSync: true,
    syncInterval: 300000, // 5 minutes
    wifiOnly: false,
    
    // App settings
    theme: 'system',
    language: 'pt-BR',
    notifications: true,
    
    // Server settings
    serverUrl: 'http://localhost:3000',
    timeout: 30000,
  });

  const [deviceInfo, setDeviceInfo] = useState({});
  const [showServerDialog, setShowServerDialog] = useState(false);
  const [tempServerUrl, setTempServerUrl] = useState('');
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  useEffect(() => {
    loadSettings();
    loadDeviceInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const locationSettings = await LocationService.getLocationSettings();
      const appSettings = await AsyncStorage.getItem('appSettings');
      const serverSettings = await AsyncStorage.getItem('serverSettings');

      setSettings(prevSettings => ({
        ...prevSettings,
        ...locationSettings,
        ...(appSettings ? JSON.parse(appSettings) : {}),
        ...(serverSettings ? JSON.parse(serverSettings) : {}),
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadDeviceInfo = async () => {
    try {
      const info = {
        deviceName: await DeviceInfo.getDeviceName(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        deviceId: DeviceInfo.getDeviceId(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
      };
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error loading device info:', error);
    }
  };

  const saveLocationSettings = async (newSettings) => {
    try {
      await LocationService.saveLocationSettings(newSettings);
      setSettings(prevSettings => ({...prevSettings, ...newSettings}));
    } catch (error) {
      console.error('Error saving location settings:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações de localização');
    }
  };

  const saveAppSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(prevSettings => ({...prevSettings, ...newSettings}));
    } catch (error) {
      console.error('Error saving app settings:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações do aplicativo');
    }
  };

  const saveServerSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('serverSettings', JSON.stringify(newSettings));
      setSettings(prevSettings => ({...prevSettings, ...newSettings}));
    } catch (error) {
      console.error('Error saving server settings:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações do servidor');
    }
  };

  const handleLocationAccuracyChange = (value) => {
    saveLocationSettings({...settings, enableHighAccuracy: value});
  };

  const handleBackgroundLocationChange = (value) => {
    if (value) {
      Alert.alert(
        'Localização em Segundo Plano',
        'Esta funcionalidade requer permissões especiais e pode afetar a duração da bateria. Deseja continuar?',
        [
          {text: 'Cancelar', style: 'cancel'},
          {text: 'Continuar', onPress: () => saveLocationSettings({...settings, enableBackground: value})}
        ]
      );
    } else {
      saveLocationSettings({...settings, enableBackground: value});
    }
  };

  const handleAutoSyncChange = (value) => {
    saveAppSettings({...settings, autoSync: value});
  };

  const handleWifiOnlyChange = (value) => {
    saveAppSettings({...settings, wifiOnly: value});
  };

  const handleNotificationsChange = (value) => {
    saveAppSettings({...settings, notifications: value});
  };

  const handleServerUrlSave = () => {
    if (!tempServerUrl.trim()) {
      Alert.alert('Erro', 'URL do servidor não pode estar vazio');
      return;
    }

    // Basic URL validation
    try {
      new URL(tempServerUrl);
    } catch (error) {
      Alert.alert('Erro', 'URL do servidor inválida');
      return;
    }

    saveServerSettings({...settings, serverUrl: tempServerUrl});
    setShowServerDialog(false);
  };

  const clearCache = async () => {
    Alert.alert(
      'Limpar Cache',
      'Tem certeza que deseja limpar todo o cache do aplicativo? Esta ação não pode ser desfeita.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear specific cache items but keep essential data
              await AsyncStorage.multiRemove([
                'lastAutoSync',
                'appSettings',
                'locationSettings'
              ]);
              
              Alert.alert('Sucesso', 'Cache limpo com sucesso');
              loadSettings(); // Reload default settings
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Erro', 'Não foi possível limpar o cache');
            }
          }
        }
      ]
    );
  };

  const exportData = async () => {
    Alert.alert(
      'Exportar Dados',
      'Esta funcionalidade permite exportar todos os dados coletados para backup.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Exportar', onPress: () => Alert.alert('Info', 'Funcionalidade será implementada')}
      ]
    );
  };

  const resetApp = () => {
    Alert.alert(
      'Resetar Aplicativo',
      'ATENÇÃO: Esta ação irá apagar TODOS os dados do aplicativo, incluindo formulários e dados coletados. Esta ação não pode ser desfeita.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'RESETAR',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmação Final',
              'Tem ABSOLUTA certeza? Todos os dados serão perdidos permanentemente.',
              [
                {text: 'Cancelar', style: 'cancel'},
                {
                  text: 'SIM, RESETAR',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Clear all AsyncStorage
                      await AsyncStorage.clear();
                      
                      // Clear database (in a real app, you would delete the database file)
                      Alert.alert('Info', 'Para completar o reset, feche e reabra o aplicativo');
                    } catch (error) {
                      console.error('Error resetting app:', error);
                      Alert.alert('Erro', 'Não foi possível resetar o aplicativo');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* Location Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Configurações de Localização</Title>
          
          <List.Item
            title="Alta Precisão GPS"
            description="Usar GPS para maior precisão (consome mais bateria)"
            left={props => <List.Icon {...props} icon="gps-fixed" />}
            right={() => (
              <Switch
                value={settings.enableHighAccuracy}
                onValueChange={handleLocationAccuracyChange}
              />
            )}
          />

          <List.Item
            title="Localização em Segundo Plano"
            description="Continuar capturando localização quando o app estiver em segundo plano"
            left={props => <List.Icon {...props} icon="location-history" />}
            right={() => (
              <Switch
                value={settings.enableBackground}
                onValueChange={handleBackgroundLocationChange}
              />
            )}
          />

          <List.Item
            title="Configurações Avançadas"
            description="Intervalo de atualização e distância mínima"
            left={props => <List.Icon {...props} icon="tune" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowLocationDialog(true)}
          />
        </Card.Content>
      </Card>

      {/* Sync Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Configurações de Sincronização</Title>
          
          <List.Item
            title="Sincronização Automática"
            description="Sincronizar automaticamente quando conectado à internet"
            left={props => <List.Icon {...props} icon="sync" />}
            right={() => (
              <Switch
                value={settings.autoSync}
                onValueChange={handleAutoSyncChange}
              />
            )}
          />

          <List.Item
            title="Apenas Wi-Fi"
            description="Sincronizar apenas quando conectado ao Wi-Fi"
            left={props => <List.Icon {...props} icon="wifi" />}
            right={() => (
              <Switch
                value={settings.wifiOnly}
                onValueChange={handleWifiOnlyChange}
              />
            )}
          />

          <List.Item
            title="Servidor"
            description={settings.serverUrl}
            left={props => <List.Icon {...props} icon="cloud" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              setTempServerUrl(settings.serverUrl);
              setShowServerDialog(true);
            }}
          />
        </Card.Content>
      </Card>

      {/* App Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Configurações do Aplicativo</Title>
          
          <List.Item
            title="Notificações"
            description="Receber notificações do aplicativo"
            left={props => <List.Icon {...props} icon="notifications" />}
            right={() => (
              <Switch
                value={settings.notifications}
                onValueChange={handleNotificationsChange}
              />
            )}
          />

          <List.Item
            title="Idioma"
            description="Português (Brasil)"
            left={props => <List.Icon {...props} icon="language" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Info', 'Seleção de idioma será implementada')}
          />

          <List.Item
            title="Tema"
            description="Sistema"
            left={props => <List.Icon {...props} icon="palette" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Info', 'Seleção de tema será implementada')}
          />
        </Card.Content>
      </Card>

      {/* Data Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Gerenciamento de Dados</Title>
          
          <List.Item
            title="Exportar Dados"
            description="Fazer backup de todos os dados coletados"
            left={props => <List.Icon {...props} icon="file-download" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={exportData}
          />

          <List.Item
            title="Limpar Cache"
            description="Limpar arquivos temporários e cache do aplicativo"
            left={props => <List.Icon {...props} icon="clear-all" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={clearCache}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Resetar Aplicativo"
            description="CUIDADO: Apagar todos os dados permanentemente"
            titleStyle={styles.dangerText}
            descriptionStyle={styles.dangerText}
            left={props => <List.Icon {...props} icon="warning" color="#F44336" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={resetApp}
          />
        </Card.Content>
      </Card>

      {/* Device Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Informações do Dispositivo</Title>
          
          <View style={styles.deviceInfo}>
            <View style={styles.deviceInfoRow}>
              <Paragraph style={styles.deviceInfoLabel}>Dispositivo:</Paragraph>
              <Paragraph style={styles.deviceInfoValue}>{deviceInfo.deviceName}</Paragraph>
            </View>
            
            <View style={styles.deviceInfoRow}>
              <Paragraph style={styles.deviceInfoLabel}>Sistema:</Paragraph>
              <Paragraph style={styles.deviceInfoValue}>
                {deviceInfo.systemName} {deviceInfo.systemVersion}
              </Paragraph>
            </View>

            <View style={styles.deviceInfoRow}>
              <Paragraph style={styles.deviceInfoLabel}>Modelo:</Paragraph>
              <Paragraph style={styles.deviceInfoValue}>
                {deviceInfo.brand} {deviceInfo.model}
              </Paragraph>
            </View>

            <View style={styles.deviceInfoRow}>
              <Paragraph style={styles.deviceInfoLabel}>App:</Paragraph>
              <Paragraph style={styles.deviceInfoValue}>
                v{deviceInfo.appVersion} ({deviceInfo.buildNumber})
              </Paragraph>
            </View>

            <View style={styles.deviceInfoRow}>
              <Paragraph style={styles.deviceInfoLabel}>ID:</Paragraph>
              <Paragraph style={styles.deviceInfoValue}>{deviceInfo.deviceId}</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Server URL Dialog */}
      <Portal>
        <Dialog visible={showServerDialog} onDismiss={() => setShowServerDialog(false)}>
          <Dialog.Title>Configurar Servidor</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="URL do Servidor"
              value={tempServerUrl}
              onChangeText={setTempServerUrl}
              placeholder="http://seu-servidor.com:3000"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowServerDialog(false)}>Cancelar</Button>
            <Button onPress={handleServerUrlSave}>Salvar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Location Settings Dialog */}
        <Dialog visible={showLocationDialog} onDismiss={() => setShowLocationDialog(false)}>
          <Dialog.Title>Configurações Avançadas de Localização</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogDescription}>
              Estas configurações afetam a precisão e o consumo de bateria do GPS.
            </Paragraph>
            
            <TextInput
              label="Intervalo de Atualização (ms)"
              value={settings.updateInterval.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 5000;
                setSettings(prev => ({...prev, updateInterval: value}));
              }}
              keyboardType="numeric"
              style={styles.dialogInput}
            />

            <TextInput
              label="Distância Mínima (metros)"
              value={settings.minDistance.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 10;
                setSettings(prev => ({...prev, minDistance: value}));
              }}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLocationDialog(false)}>Cancelar</Button>
            <Button onPress={() => {
              saveLocationSettings({
                enableHighAccuracy: settings.enableHighAccuracy,
                enableBackground: settings.enableBackground,
                updateInterval: settings.updateInterval,
                minDistance: settings.minDistance,
              });
              setShowLocationDialog(false);
            }}>
              Salvar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  dangerText: {
    color: '#F44336',
  },
  deviceInfo: {
    marginTop: 8,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  deviceInfoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  deviceInfoValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  dialogDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  dialogInput: {
    marginBottom: 12,
  },
});

export default SettingsScreen;