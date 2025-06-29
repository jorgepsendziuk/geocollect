# 🚀 Como Executar o GeoCOLLECT - Guia Rápido

## ⚡ Execução Rápida (Demo)

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar o Servidor de Demonstração
```bash
node demo-server.js
```

**✅ Pronto! O servidor estará rodando em http://localhost:3000**

## 🧪 Testando a API

### Verificar se está funcionando:
```bash
curl http://localhost:3000/health
```

### Ver demonstração completa:
```bash
curl http://localhost:3000/api/demo | python3 -m json.tool
```

### Ver estatísticas:
```bash
curl http://localhost:3000/api/stats | python3 -m json.tool
```

### Listar formulários disponíveis:
```bash
curl http://localhost:3000/api/forms | python3 -m json.tool
```

### Criar um novo formulário:
```bash
curl -X POST http://localhost:3000/api/forms \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meu Formulário",
    "description": "Descrição do formulário",
    "fields": [
      {
        "name": "nome",
        "label": "Nome",
        "type": "text",
        "required": true,
        "order": 1
      }
    ]
  }'
```

### Submeter dados coletados:
```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "ID_DO_FORMULARIO",
    "userId": "usuario-teste",
    "status": "completed",
    "latitude": -15.7801,
    "longitude": -47.8292,
    "values": [
      {
        "fieldName": "nome",
        "value": "João Silva"
      }
    ]
  }'
```

## 🌐 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status da API |
| GET | `/api/demo` | Demonstração completa |
| GET | `/api/forms` | Listar formulários |
| POST | `/api/forms` | Criar formulário |
| GET | `/api/data` | Listar dados coletados |
| POST | `/api/data` | Submeter dados |
| GET | `/api/stats` | Estatísticas |
| GET | `/api/sync/status` | Status de sincronização |

## 📱 Funcionalidades Implementadas

### ✅ Backend Completo
- **API RESTful** com Express.js
- **Formulários dinâmicos** com tipos de campo variados
- **Coleta de dados** com GPS e metadados
- **Sistema de sincronização** 
- **Dados de exemplo** pré-carregados

### 📋 Tipos de Campo Suportados
- `text` - Texto simples
- `textarea` - Texto longo
- `number` - Números
- `email` - Email
- `phone` - Telefone
- `date` - Data
- `time` - Hora
- `datetime` - Data e hora
- `select` - Lista suspensa
- `radio` - Seleção única
- `checkbox` - Múltipla escolha
- `photo` - Captura de foto
- `gps` - Coordenadas GPS
- `signature` - Assinatura digital
- `barcode` - Código de barras
- `rating` - Avaliação por estrelas
- `slider` - Controle deslizante
- `boolean` - Verdadeiro/Falso

### 🗺️ Recursos de GPS
- Coordenadas latitude/longitude
- Precisão (accuracy)
- Altitude
- Timestamp de captura

### 📊 Recursos de Dados
- Coleta offline (simulada)
- Sincronização automática
- Metadados do dispositivo
- Versionamento de formulários
- Status de envio

## 🔄 Próximos Passos

### Para produção completa:
1. **Configurar PostgreSQL** seguindo o `SETUP.md`
2. **Desenvolver app React Native** mobile
3. **Implementar mapas offline**
4. **Adicionar autenticação**
5. **Deploy em servidor**

### Para desenvolvimento:
1. **Clonar este repositório**
2. **Executar `npm install`**
3. **Executar `node demo-server.js`**
4. **Testar endpoints com curl ou Postman**

---

## 🎯 Resumo de Execução

```bash
# 1. Instalar dependências
npm install

# 2. Executar servidor
node demo-server.js

# 3. Testar em outro terminal
curl http://localhost:3000/health

# 4. Ver demo completa
curl http://localhost:3000/api/demo
```

**🎉 É isso! O GeoCOLLECT está funcionando perfeitamente!**

A API está configurada com dados de exemplo e pronta para demonstrar todas as funcionalidades de um sistema de coleta de dados geográficos como o ODK Collect.