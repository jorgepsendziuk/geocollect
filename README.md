# GeoCOLLECT

Uma aplicação de coleta de dados geográficos inspirada no ODK Collect, desenvolvida com React Native e PostgreSQL.

## 🌟 Características Principais

### 📱 Aplicativo Mobile (React Native)
- ✅ **Coleta de dados offline** - Funciona sem conexão com a internet
- ✅ **Formulários dinâmicos** - Crie formulários personalizados com diversos tipos de campos
- ✅ **Captura de fotos** - Integração com câmera e galeria com metadados GPS
- ✅ **Localização GPS** - Captura automática de coordenadas precisas
- ✅ **Mapas offline** - Visualização de dados coletados em mapas
- ✅ **Sincronização automática** - Envio automático de dados quando online
- ✅ **Interface em português** - Totalmente traduzido para pt-BR

### 🗄️ Backend (Node.js + PostgreSQL)
- ✅ **API RESTful** - Interface completa para gerenciamento de dados
- ✅ **Banco PostgreSQL** - Armazenamento robusto e escalável
- ✅ **Upload de arquivos** - Gerenciamento de fotos e documentos
- ✅ **Autenticação JWT** - Sistema seguro de autenticação
- ✅ **Sincronização** - Sistema de fila para dados offline

## 🏗️ Arquitetura

```
geocollect/
├── src/                    # App React Native
│   ├── screens/           # Telas do aplicativo
│   ├── services/          # Serviços (Database, Location, Sync)
│   ├── components/        # Componentes reutilizáveis
│   └── utils/            # Utilitários
├── server/               # Backend Node.js
│   ├── models/          # Modelos do banco de dados
│   ├── routes/          # Rotas da API
│   └── middleware/      # Middlewares
└── docs/                # Documentação
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 16+ 
- **React Native CLI** 
- **PostgreSQL** 12+
- **Android Studio** / **Xcode** (para desenvolvimento mobile)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/geocollect.git
cd geocollect
```

### 2. Configuração do Backend

```bash
# Instalar dependências do servidor
cd server
npm install

# Configurar banco de dados
cp .env.example .env
# Edite o arquivo .env com suas configurações do PostgreSQL

# Executar migrações
npm run migrate

# Iniciar servidor
npm run dev
```

### 3. Configuração do App Mobile

```bash
# Voltar para raiz e instalar dependências
cd ..
npm install

# iOS (se usando Mac)
cd ios && pod install && cd ..

# Iniciar Metro bundler
npm start

# Em outro terminal, executar o app
npm run android  # ou npm run ios
```

### 4. Configuração do Banco de Dados

Crie um banco PostgreSQL e configure as tabelas:

```sql
-- Exemplo de configuração rápida
CREATE DATABASE geocollect;
CREATE USER geocollect_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE geocollect TO geocollect_user;
```

## 📋 Tipos de Campos Suportados

O sistema suporta diversos tipos de campos para formulários dinâmicos:

### Campos de Texto
- `text` - Texto simples
- `textarea` - Texto longo (múltiplas linhas)
- `email` - Email com validação
- `phone` - Telefone
- `number` - Números

### Campos de Seleção
- `select` - Lista suspensa
- `multiselect` - Seleção múltipla
- `radio` - Botões de opção
- `checkbox` - Caixas de seleção

### Campos Especiais
- `date` - Seletor de data
- `time` - Seletor de hora
- `datetime` - Data e hora
- `photo` - Captura de foto com GPS
- `file` - Upload de arquivo
- `gps` - Coordenadas GPS
- `signature` - Assinatura digital
- `barcode` - Leitor de código de barras

## 🗺️ Funcionalidades de Mapa

### Visualização
- Mapas padrão, satélite, híbrido e terreno
- Marcadores coloridos por status dos dados
- Informações detalhadas ao tocar nos marcadores
- Filtros por formulário

### Navegação
- Localização atual em tempo real
- Rastreamento de localização
- Círculo de precisão GPS
- Zoom automático

## 🔄 Sistema de Sincronização

### Funcionamento
1. **Coleta offline** - Dados são salvos localmente no SQLite
2. **Fila de sincronização** - Itens são adicionados à fila automaticamente
3. **Sincronização automática** - Quando conectado, dados são enviados
4. **Retry automático** - Falhas são tentadas novamente
5. **Conflito de versões** - Sistema de versionamento para resolver conflitos

### Estados de Sincronização
- `pending` - Aguardando sincronização
- `processing` - Sincronizando
- `completed` - Sincronizado com sucesso
- `failed` - Falha na sincronização

## 📱 Telas do Aplicativo

### 🏠 **Tela Inicial (Home)**
- Dashboard com estatísticas
- Formulários recentes
- Registros recentes
- Status de sincronização
- Localização atual

### 📝 **Formulários**
- Lista de formulários disponíveis
- Filtros por categoria
- Busca por nome/descrição
- Criar/editar/duplicar formulários

### 🗺️ **Mapa**
- Visualização de todos os dados coletados
- Diferentes tipos de mapa
- Filtros por formulário
- Detalhes dos registros

### 🔄 **Sincronização**
- Status da conexão
- Estatísticas de sync
- Fila de sincronização
- Controles manuais

### ⚙️ **Configurações**
- Configurações de GPS
- Configurações de sincronização
- Informações do dispositivo
- Gerenciamento de dados

## 🔧 Configurações Avançadas

### GPS e Localização
```javascript
// Configurações de localização
{
  enableHighAccuracy: true,    // Alta precisão GPS
  enableBackground: false,     // Localização em segundo plano
  updateInterval: 5000,        // Intervalo de atualização (ms)
  minDistance: 10             // Distância mínima para atualizar (m)
}
```

### Sincronização
```javascript
// Configurações de sync
{
  autoSync: true,             // Sincronização automática
  syncInterval: 300000,       // Intervalo de verificação (5 min)
  wifiOnly: false,           // Apenas Wi-Fi
  maxRetries: 3              // Máximo de tentativas
}
```

## 🔌 API Endpoints

### Formulários
- `GET /api/forms` - Listar formulários
- `POST /api/forms` - Criar formulário
- `PUT /api/forms/:id` - Atualizar formulário
- `DELETE /api/forms/:id` - Excluir formulário

### Dados
- `GET /api/data` - Listar registros
- `POST /api/data` - Criar registro
- `PUT /api/data/:id` - Atualizar registro
- `DELETE /api/data/:id` - Excluir registro

### Arquivos
- `POST /api/upload` - Upload de arquivo
- `GET /uploads/:filename` - Download de arquivo

### Sincronização
- `POST /api/sync/pull` - Baixar atualizações
- `POST /api/sync/push` - Enviar dados

## 🛠️ Desenvolvimento

### Estrutura dos Serviços

#### DatabaseService
```javascript
// Gerencia banco SQLite local
- initialize()           // Inicializar banco
- saveForms()           // Salvar formulários
- getForms()            // Obter formulários
- saveDataEntry()       // Salvar registro
- getDataEntries()      // Obter registros
```

#### LocationService
```javascript
// Gerencia GPS e localização
- initialize()                    // Inicializar GPS
- getCurrentLocation()            // Localização atual
- startLocationTracking()         // Rastreamento contínuo
- calculateDistance()             // Calcular distância
```

#### SyncService
```javascript
// Gerencia sincronização
- initialize()          // Inicializar serviço
- syncAll()            // Sincronizar tudo
- queueDataForSync()   // Adicionar à fila
- getSyncStatus()      // Status de sincronização
```

### Adicionando Novos Tipos de Campo

1. **Adicionar ao enum** no modelo `FormField`
2. **Implementar renderização** em `DataCollectionScreen`
3. **Adicionar validação** se necessário
4. **Atualizar documentação**

## 🧪 Testes

```bash
# Executar testes do React Native
npm test

# Executar testes do servidor
cd server
npm test

# Executar testes E2E
npm run test:e2e
```

## 📦 Build e Deploy

### Android
```bash
# Build de desenvolvimento
npm run android

# Build de produção
cd android
./gradlew assembleRelease
```

### iOS
```bash
# Build de desenvolvimento
npm run ios

# Build de produção (via Xcode)
```

### Servidor
```bash
# Deploy no servidor
cd server
npm run build
npm start
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação**: [Wiki do projeto](https://github.com/seu-usuario/geocollect/wiki)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/geocollect/issues)
- **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/geocollect/discussions)

## 🙏 Agradecimentos

- [ODK Collect](https://docs.getodk.org/collect-intro/) - Inspiração para o projeto
- [React Native](https://reactnative.dev/) - Framework mobile
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados
- [React Native Paper](https://reactnativepaper.com/) - Componentes UI

---

**GeoCOLLECT** - Coletando dados geográficos com precisão e eficiência 🌍📱 