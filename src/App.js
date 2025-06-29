import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider as PaperProvider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SplashScreen from 'react-native-splash-screen';

import HomeScreen from './screens/HomeScreen';
import FormsScreen from './screens/FormsScreen';
import FormBuilderScreen from './screens/FormBuilderScreen';
import DataCollectionScreen from './screens/DataCollectionScreen';
import MapScreen from './screens/MapScreen';
import SyncScreen from './screens/SyncScreen';
import SettingsScreen from './screens/SettingsScreen';
import CameraScreen from './screens/CameraScreen';

import DatabaseService from './services/DatabaseService';
import SyncService from './services/SyncService';
import LocationService from './services/LocationService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{title: 'GeoCOLLECT'}} />
    <Stack.Screen name="DataCollection" component={DataCollectionScreen} options={{title: 'Coleta de Dados'}} />
    <Stack.Screen name="Camera" component={CameraScreen} options={{title: 'Capturar Foto'}} />
  </Stack.Navigator>
);

const FormsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Forms" component={FormsScreen} options={{title: 'Formulários'}} />
    <Stack.Screen name="FormBuilder" component={FormBuilderScreen} options={{title: 'Criar Formulário'}} />
  </Stack.Navigator>
);

const App = () => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await DatabaseService.initialize();
        
        // Initialize location service
        await LocationService.initialize();
        
        // Initialize sync service
        SyncService.initialize();
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        SplashScreen.hide();
      }
    };

    initializeApp();
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({route}) => ({
            tabBarIcon: ({focused, color, size}) => {
              let iconName;
              switch (route.name) {
                case 'HomeTab':
                  iconName = 'home';
                  break;
                case 'FormsTab':
                  iconName = 'description';
                  break;
                case 'MapTab':
                  iconName = 'map';
                  break;
                case 'SyncTab':
                  iconName = 'sync';
                  break;
                case 'SettingsTab':
                  iconName = 'settings';
                  break;
                default:
                  iconName = 'home';
              }
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#6200ee',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
          })}>
          <Tab.Screen 
            name="HomeTab" 
            component={HomeStack} 
            options={{title: 'Início'}} 
          />
          <Tab.Screen 
            name="FormsTab" 
            component={FormsStack} 
            options={{title: 'Formulários'}} 
          />
          <Tab.Screen 
            name="MapTab" 
            component={MapScreen} 
            options={{title: 'Mapa'}} 
          />
          <Tab.Screen 
            name="SyncTab" 
            component={SyncScreen} 
            options={{title: 'Sincronizar'}} 
          />
          <Tab.Screen 
            name="SettingsTab" 
            component={SettingsScreen} 
            options={{title: 'Configurações'}} 
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;