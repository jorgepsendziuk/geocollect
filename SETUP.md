# 🚀 Como Rodar o GeoCOLLECT

## 📋 Pré-requisitos

### 1. Node.js e npm
```bash
# Verificar se Node.js está instalado (versão 16+)
node --version
npm --version

# Se não estiver instalado:
# Ubuntu/Debian: sudo apt install nodejs npm
# macOS: brew install node
# Windows: baixar de https://nodejs.org
```

### 2. PostgreSQL
```bash
# Verificar se PostgreSQL está instalado
psql --version

# Se não estiver instalado:
# Ubuntu/Debian: sudo apt install postgresql postgresql-contrib
# macOS: brew install postgresql
# Windows: baixar de https://www.postgresql.org/download/
```

### 3. React Native CLI
```bash
# Instalar globalmente
npm install -g react-native-cli

# Para Android - Instalar Android Studio
# Para iOS - Instalar Xcode (apenas macOS)
```

### 4. Ferramentas de Desenvolvimento
```bash
# Git
git --version

# Yarn (opcional, mas recomendado)
npm install -g yarn
```

## 🗄️ 1. Configurar o Banco de Dados

### Iniciar PostgreSQL
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS
brew services start postgresql

# Windows (como serviço)
# O PostgreSQL já deve estar rodando
```

### Criar Banco de Dados
```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Dentro do psql, executar:
CREATE DATABASE geocollect;
CREATE USER geocollect_user WITH PASSWORD 'geocollect123';
GRANT ALL PRIVILEGES ON DATABASE geocollect TO geocollect_user;
\q
```

## 🖥️ 2. Configurar o Backend

### Navegar para o diretório do servidor
```bash
cd server
```

### Instalar dependências
```bash
npm install
# ou
yarn install
```

### Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env
nano .env
```

Configurar o `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geocollect
DB_USER=geocollect_user
DB_PASSWORD=geocollect123

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_123456
BCRYPT_ROUNDS=10

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Sync Configuration
SYNC_INTERVAL=300000
MAX_SYNC_RETRIES=3
```

### Criar diretório de uploads
```bash
mkdir -p uploads
```

### Executar migrações (opcional - o Sequelize criará as tabelas automaticamente)
```bash
npm run migrate
```

### Iniciar o servidor
```bash
npm run dev
# ou
npm start
```

**✅ O servidor estará rodando em: http://localhost:3000**

## 📱 3. Configurar o App React Native

### Em outro terminal, voltar para o diretório raiz
```bash
cd ..
```

### Instalar dependências
```bash
npm install
# ou
yarn install
```

### Configurações específicas do React Native

#### Para Android:
```bash
# Verificar se o Android SDK está configurado
echo $ANDROID_HOME

# Se não estiver, adicionar ao ~/.bashrc ou ~/.zshrc:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### Para iOS (apenas macOS):
```bash
cd ios
pod install
cd ..
```

### Iniciar o Metro Bundler
```bash
# Em um terminal separado
npm start
# ou
yarn start
```

### Executar o app

#### Android:
```bash
# Conectar dispositivo via USB ou iniciar emulador
adb devices

# Executar o app
npm run android
# ou
yarn android
```

#### iOS (apenas macOS):
```bash
npm run ios
# ou
yarn ios
```

## 🔧 4. Verificar se Tudo Está Funcionando

### Testar o Backend
```bash
# Testar endpoint de saúde
curl http://localhost:3000/health

# Resposta esperada:
# {"status":"OK","timestamp":"2024-01-XX..."}
```

### Testar o App
1. **Abrir o app** no dispositivo/emulador
2. **Verificar localização GPS** - permissão deve ser solicitada
3. **Testar formulários** - criar um formulário simples
4. **Testar coleta offline** - desconectar internet e coletar dados
5. **Testar sincronização** - reconectar e verificar se dados são enviados

## 🐛 Solução de Problemas Comuns

### Erro de Conexão com PostgreSQL
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conexão
psql -h localhost -U geocollect_user -d geocollect -W
```

### Erro no React Native Android
```bash
# Limpar cache
npx react-native start --reset-cache

# Recompilar
cd android
./gradlew clean
cd ..
npm run android
```

### Erro de Permissões
```bash
# Android - verificar permissões no AndroidManifest.xml
# iOS - verificar Info.plist

# Reinstalar app se necessário
npm run android --reset-cache
```

### Erro de Metro/Bundler
```bash
# Parar todos os processos
pkill -f metro

# Limpar cache
npx react-native start --reset-cache

# Reinstalar node_modules
rm -rf node_modules
npm install
```

## 📊 5. Dados de Teste

### Criar Formulário de Exemplo via API
```bash
curl -X POST http://localhost:3000/api/forms \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Inspeção de Campo",
    "description": "Formulário para inspeção de campo com GPS",
    "fields": [
      {
        "name": "observador",
        "label": "Nome do Observador",
        "type": "text",
        "required": true,
        "order": 1
      },
      {
        "name": "foto",
        "label": "Foto do Local",
        "type": "photo",
        "required": true,
        "order": 2
      },
      {
        "name": "localizacao",
        "label": "Coordenadas GPS",
        "type": "gps",
        "required": true,
        "order": 3
      }
    ],
    "requireGPS": true,
    "requirePhotos": true,
    "createdBy": "test-user"
  }'
```

## 🚦 Status dos Serviços

### Verificar se tudo está rodando:
```bash
# Backend
curl -s http://localhost:3000/health

# PostgreSQL
pg_isready -h localhost -p 5432

# React Native Metro
curl -s http://localhost:8081/status
```

## 📱 Fluxo de Teste Completo

1. **Backend**: http://localhost:3000/health deve retornar `{"status":"OK"}`
2. **App**: Abrir no dispositivo e verificar tela inicial
3. **GPS**: Permitir acesso à localização quando solicitado
4. **Formulário**: Ir em "Formulários" → "Criar Formulário"
5. **Coleta**: Preencher um formulário com foto e GPS
6. **Sincronização**: Verificar na aba "Sincronizar"
7. **Mapa**: Ver dados coletados na aba "Mapa"

## 🔄 Comandos de Desenvolvimento

```bash
# Recompilar apenas o backend
cd server && npm run dev

# Recompilar apenas o app
npm start -- --reset-cache

# Ver logs do Android
adb logcat *:S ReactNative:V ReactNativeJS:V

# Ver logs do iOS
react-native log-ios

# Debugger do React Native
# Pressionar 'd' no terminal do Metro, depois 'j'
```

---

**🎉 Parabéns!** Se seguiu todos os passos, o GeoCOLLECT deve estar rodando perfeitamente em seu ambiente de desenvolvimento!