# 🌍 GeoCOLLECT

**Sistema de Coleta de Dados Geográficos Offline**  
*Inspirado no ODK Collect com React Native e PostgreSQL*

## 🚀 Execução Rápida

```bash
# 1. Instalar dependências
npm install

# 2. Executar servidor de demonstração
node demo-server.js

# 3. Testar API (em outro terminal)
curl http://localhost:3000/health
curl http://localhost:3000/api/demo
```

**✅ O servidor estará rodando em http://localhost:3000**

## 📱 Sobre o GeoCOLLECT

O GeoCOLLECT é uma aplicação completa de coleta de dados geográficos offline, desenvolvida como alternativa moderna ao ODK Collect. O sistema permite:

- ✅ **Coleta de dados offline** com sincronização automática
- ✅ **Formulários dinâmicos** com 18+ tipos de campo
- ✅ **Integração GPS** com alta precisão
- ✅ **Captura de fotos** com metadados de localização
- ✅ **Mapas offline** para visualização de dados
- ✅ **API RESTful** completa com PostgreSQL
- ✅ **App React Native** para dispositivos móveis

## 🏗️ Arquitetura

### Backend (Node.js + PostgreSQL)
- **API RESTful** com Express.js
- **Banco PostgreSQL** com Sequelize ORM
- **Sistema de sync** offline-to-online
- **Upload de arquivos** com Multer
- **Autenticação JWT** e segurança
- **Suporte a dados em lote**

### Mobile (React Native)
- **Navegação nativa** com React Navigation
- **Mapas offline** com react-native-maps
- **GPS integrado** com geolocalização
- **Câmera nativa** para captura de fotos
- **SQLite local** para dados offline
- **Material Design** com react-native-paper

## � Tipos de Campo Suportados

| Tipo | Descrição | Recursos |
|------|-----------|----------|
| `text` | Texto simples | Validação, placeholder |
| `textarea` | Texto longo | Múltiplas linhas |
| `number` | Números | Min/max, decimal |
| `email` | Email | Validação automática |
| `phone` | Telefone | Máscara de formatação |
| `date` | Data | Seletor nativo |
| `time` | Hora | Seletor de tempo |
| `datetime` | Data e hora | Combinado |
| `select` | Lista suspensa | Opções múltiplas |
| `radio` | Seleção única | Botões de rádio |
| `checkbox` | Múltipla escolha | Checkboxes |
| `photo` | Captura de foto | GPS + metadata |
| `gps` | Coordenadas GPS | Precisão configurável |
| `signature` | Assinatura digital | Canvas touch |
| `barcode` | Código de barras | Scanner QR/Code |
| `rating` | Avaliação | Sistema de estrelas |
| `slider` | Controle deslizante | Valores numéricos |
| `boolean` | Verdadeiro/Falso | Switch toggle |

## 🌐 API Endpoints

### Formulários
- `GET /api/forms` - Listar formulários
- `POST /api/forms` - Criar formulário
- `GET /api/forms/:id` - Obter formulário
- `PUT /api/forms/:id` - Atualizar formulário
- `DELETE /api/forms/:id` - Remover formulário

### Dados Coletados
- `GET /api/data` - Listar dados
- `POST /api/data` - Submeter dados
- `GET /api/data/:id` - Obter registro
- `PUT /api/data/:id` - Atualizar registro

### Sincronização
- `GET /api/sync/status` - Status de sync
- `POST /api/sync/push` - Enviar dados offline
- `GET /api/sync/pull` - Baixar atualizações

### Sistema
- `GET /health` - Status da API
- `GET /api/stats` - Estatísticas gerais
- `GET /api/demo` - Demonstração completa

## 🗺️ Funcionalidades de GPS

- **Localização de alta precisão** com GPS/GLONASS
- **Coordenadas em tempo real** (lat/lng/altitude)
- **Cálculo de precisão** e margem de erro
- **Tracking contínuo** para formulários longos
- **Formatação flexível** (decimal, DMS, UTM)
- **Detecção automática** de movimentação

## 📷 Recursos de Mídia

- **Captura nativa** com câmera do dispositivo
- **Seleção da galeria** de fotos existentes
- **Metadados GPS** incorporados nas imagens
- **Compressão automática** para economizar espaço
- **Upload em lote** durante sincronização
- **Preview** antes do envio

## 🔄 Sistema de Sincronização

### Offline-First
- **SQLite local** para armazenamento offline
- **Fila de sincronização** para dados pendentes
- **Detecção de conectividade** automática
- **Retry inteligente** para falhas de rede

### Sincronização Inteligente
- **Sync incremental** apenas de dados novos
- **Resolução de conflitos** automática
- **Compressão de dados** para economia de banda
- **Progresso em tempo real** do upload

## 📊 Exemplo de Uso

### 1. Criar Formulário
```json
{
  "title": "Inspeção de Campo",
  "description": "Formulário para inspeção urbana",
  "requireGPS": true,
  "requirePhotos": true,
  "fields": [
    {
      "name": "observador",
      "label": "Nome do Observador",
      "type": "text",
      "required": true
    },
    {
      "name": "foto",
      "label": "Foto do Local",
      "type": "photo",
      "required": true
    },
    {
      "name": "gps",
      "label": "Localização",
      "type": "gps",
      "required": true
    }
  ]
}
```

### 2. Coletar Dados
```json
{
  "formId": "form-uuid",
  "userId": "user-123",
  "latitude": -15.7801,
  "longitude": -47.8292,
  "accuracy": 5.2,
  "values": [
    {
      "fieldName": "observador",
      "value": "João Silva"
    },
    {
      "fieldName": "foto",
      "value": "data:image/jpeg;base64,..."
    }
  ]
}
```

## � Configuração e Setup

### Requisitos
- **Node.js** 16+ e npm
- **PostgreSQL** 12+
- **React Native CLI**
- **Android Studio** ou **Xcode**

### Configuração Rápida
1. Clone o repositório
2. Execute `npm install`
3. Configure o banco PostgreSQL
4. Execute `node demo-server.js` para testar
5. Para produção, siga o `SETUP.md`

### Configuração Completa
Consulte os arquivos de documentação:
- 📄 `SETUP.md` - Setup completo com PostgreSQL
- ⚡ `EXECUTAR.md` - Guia rápido de execução
- 🔧 `server/.env.example` - Configurações do servidor

## � Status do Projeto

### ✅ Implementado
- Backend API completo
- Modelos de dados PostgreSQL
- Sistema de formulários dinâmicos
- Endpoints de sincronização
- Estrutura React Native
- Serviços de GPS e câmera
- Armazenamento offline (SQLite)

### 🔄 Em Desenvolvimento
- Interface completa do app mobile
- Mapas offline integrados
- Sistema de autenticação
- Testes automatizados
- Documentação da API

### � Roadmap
- Deploy em produção
- Performance otimizada
- Múltiplos idiomas
- Relatórios e dashboards
- Integração com outros sistemas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

Desenvolvido como uma alternativa moderna e poderosa ao ODK Collect, focando em:
- **Performance** e **usabilidade**
- **Tecnologias modernas** (React Native, PostgreSQL)
- **Experiência mobile** otimizada
- **Sincronização robusta** offline-online

---

**🎯 GeoCOLLECT - Coleta de dados geográficos simplificada e poderosa!** 