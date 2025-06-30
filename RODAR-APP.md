# 📱 Como Rodar o App GeoCOLLECT

## 🚀 Pré-requisitos para App Mobile

### 📋 **Softwares Necessários:**
- **Node.js** 16+ ✅ (já instalado)
- **React Native CLI** 
- **Android Studio** (para Android)
- **Xcode** (para iOS - apenas macOS)

### 📱 **Dispositivos:**
- **Emulador Android** (Android Studio)
- **Simulador iOS** (Xcode - apenas macOS)  
- **Dispositivo físico** (USB ou Wi-Fi)

---

## 🔧 Configuração Inicial

### 1. **Instalar React Native CLI**
```bash
# Instalar globalmente
npm install -g react-native-cli

# Verificar instalação
react-native --version
```

### 2. **Configurar Android (se usando Android)**
```bash
# Definir variáveis de ambiente
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Adicionar ao ~/.bashrc ou ~/.zshrc
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools' >> ~/.bashrc
```

### 3. **Instalar Dependências do App**
```bash
# No diretório raiz do projeto
npm install

# Se houver dependências iOS (apenas macOS)
cd ios && pod install && cd ..
```

---

## 🖥️ Executando o Backend (API)

### **Método 1: Servidor de Demonstração (Recomendado)**
```bash
# Executar em um terminal
PORT=3001 node demo-server.js

# Verificar se está funcionando
curl http://localhost:3001/health
```

### **Método 2: Servidor Completo (com PostgreSQL)**
```bash
# Configurar PostgreSQL primeiro
cd server
npm install
cp .env.example .env
# Editar .env com configurações do banco

# Executar servidor
npm run dev
```

---

## 📱 Executando o App Mobile

### **Método 1: Emulador Android**

#### **1. Iniciar Metro Bundler:**
```bash
# Em um terminal separado
npm start
# ou
npx react-native start
```

#### **2. Abrir emulador Android:**
```bash
# Listar emuladores disponíveis
emulator -list-avds

# Iniciar emulador (substitua pelo nome do seu AVD)
emulator -avd Pixel_3a_API_30_x86

# Ou usar Android Studio para abrir emulador
```

#### **3. Executar app no emulador:**
```bash
# Em outro terminal
npm run android
# ou
npx react-native run-android
```

### **Método 2: Dispositivo Android Físico**

#### **1. Habilitar modo desenvolvedor:**
- Configurações → Sobre o telefone
- Toque 7 vezes em "Número da versão"
- Configurações → Opções do desenvolvedor
- Ativar "Depuração USB"

#### **2. Conectar dispositivo:**
```bash
# Verificar se dispositivo está conectado
adb devices

# Deve aparecer algo como:
# 1234567890ABCDEF    device
```

#### **3. Executar app:**
```bash
# Iniciar Metro
npm start

# Em outro terminal
npm run android
```

### **Método 3: iOS (apenas macOS)**

#### **1. Instalar dependências iOS:**
```bash
cd ios
pod install
cd ..
```

#### **2. Executar no simulador:**
```bash
# Iniciar Metro
npm start

# Em outro terminal
npm run ios
# ou especificar simulador
npx react-native run-ios --simulator="iPhone 14"
```

---

## 🌐 Alternativa: Web App (Demonstração)

Como o React Native pode ser complexo de configurar, vou criar uma versão web simples:

### **Criar Web App de Demonstração:**
```bash
# Executar servidor web simples
python3 -m http.server 8080

# Acesse http://localhost:8080/web-app.html
```

---

## 🔧 Configuração do App para API

### **Arquivo de Configuração da API:**
```javascript
// src/config/api.js
const API_CONFIG = {
  // Para emulador Android
  BASE_URL: 'http://10.0.2.2:3001',
  
  // Para dispositivo físico (substitua pelo IP da máquina)
  // BASE_URL: 'http://192.168.1.100:3001',
  
  // Para iOS Simulator
  // BASE_URL: 'http://localhost:3001',
  
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

export default API_CONFIG;
```

---

## 🧪 Testando o App

### **1. Verificar Conectividade:**
```bash
# No emulador Android, testar conectividade
adb shell ping 10.0.2.2

# No dispositivo físico, testar
curl http://SEU_IP:3001/health
```

### **2. Logs do App:**
```bash
# Ver logs Android
npx react-native log-android

# Ver logs iOS
npx react-native log-ios

# Ou usar o Metro bundler (pressione 'j' para depuração)
```

### **3. Recarregar App:**
```bash
# Android: Pressionar 'R' duas vezes
# iOS: Cmd+R
# Ou balançar o dispositivo físico
```

---

## 🛠️ Problemas Comuns e Soluções

### **❌ Metro não inicia:**
```bash
# Limpar cache
npx react-native start --reset-cache

# Parar processos
pkill -f metro
```

### **❌ Build falha:**
```bash
# Android
cd android && ./gradlew clean && cd ..
npm run android

# iOS
cd ios && rm -rf build && cd ..
npm run ios
```

### **❌ App não conecta com API:**
```bash
# Verificar IP da máquina
ip addr show | grep inet

# Atualizar BASE_URL no config
# Para dispositivo físico: http://SEU_IP:3001
# Para emulador: http://10.0.2.2:3001
```

### **❌ Permissões negadas:**
```bash
# Android - verificar AndroidManifest.xml
# iOS - verificar Info.plist

# Desinstalar e reinstalar app
adb uninstall com.geocollect
npm run android
```

---

## 📋 Checklist de Execução

### **Backend (API):**
- ✅ Servidor rodando: `curl http://localhost:3001/health`
- ✅ Dados de teste: `curl http://localhost:3001/api/demo`

### **Metro Bundler:**
- ✅ Metro iniciado: `npm start`
- ✅ Sem erros no terminal

### **Dispositivo/Emulador:**
- ✅ Dispositivo conectado: `adb devices`
- ✅ App instalado: `npm run android`

### **Conectividade:**
- ✅ App conecta com API
- ✅ Dados carregam corretamente

---

## 🎯 Comandos Resumidos

### **Execução Completa:**
```bash
# Terminal 1: Backend
PORT=3001 node demo-server.js

# Terminal 2: Metro
npm start

# Terminal 3: App
npm run android
# ou
npm run ios
```

### **Para Desenvolvimento:**
```bash
# Resetar tudo
pkill -f node
pkill -f metro
npm start -- --reset-cache
npm run android
```

---

## 🌟 Funcionalidades do App

Quando o app estiver rodando, você poderá:

- 📋 **Ver formulários** disponíveis
- ✏️ **Criar novos formulários** dinamicamente
- 📍 **Coletar dados** com GPS
- 📷 **Capturar fotos** com localização
- 🗺️ **Visualizar no mapa** dados coletados
- 🔄 **Sincronizar** dados offline
- ⚙️ **Configurar** preferências

---

**🎉 O GeoCOLLECT estará funcionando perfeitamente em seu dispositivo móvel!**