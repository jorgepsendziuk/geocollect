const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Dados em memória para demonstração
let forms = [
  {
    id: uuidv4(),
    title: "Inspeção de Campo",
    description: "Formulário para inspeção de infraestrutura urbana",
    version: "1.0.0",
    isActive: true,
    createdBy: "demo-user",
    category: "Infraestrutura",
    requireGPS: true,
    requirePhotos: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      {
        id: uuidv4(),
        name: "observador",
        label: "Nome do Observador",
        type: "text",
        required: true,
        order: 1
      },
      {
        id: uuidv4(),
        name: "tipo_problema",
        label: "Tipo de Problema",
        type: "select",
        required: true,
        order: 2,
        options: [
          { label: "Buraco na via", value: "buraco" },
          { label: "Iluminação defeituosa", value: "iluminacao" },
          { label: "Sinalização danificada", value: "sinalizacao" },
          { label: "Outro", value: "outro" }
        ]
      },
      {
        id: uuidv4(),
        name: "foto",
        label: "Foto do Problema",
        type: "photo",
        required: true,
        order: 3
      },
      {
        id: uuidv4(),
        name: "localizacao",
        label: "Coordenadas GPS",
        type: "gps",
        required: true,
        order: 4
      },
      {
        id: uuidv4(),
        name: "observacoes",
        label: "Observações Adicionais",
        type: "textarea",
        required: false,
        order: 5
      }
    ]
  },
  {
    id: uuidv4(),
    title: "Levantamento Ambiental",
    description: "Coleta de dados para monitoramento ambiental",
    version: "1.0.0",
    isActive: true,
    createdBy: "demo-user",
    category: "Meio Ambiente",
    requireGPS: true,
    requirePhotos: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      {
        id: uuidv4(),
        name: "pesquisador",
        label: "Nome do Pesquisador",
        type: "text",
        required: true,
        order: 1
      },
      {
        id: uuidv4(),
        name: "temperatura",
        label: "Temperatura (°C)",
        type: "number",
        required: true,
        order: 2
      },
      {
        id: uuidv4(),
        name: "qualidade_agua",
        label: "Qualidade da Água",
        type: "radio",
        required: true,
        order: 3,
        options: [
          { label: "Excelente", value: "excelente" },
          { label: "Boa", value: "boa" },
          { label: "Regular", value: "regular" },
          { label: "Ruim", value: "ruim" }
        ]
      },
      {
        id: uuidv4(),
        name: "data_coleta",
        label: "Data da Coleta",
        type: "date",
        required: true,
        order: 4
      }
    ]
  }
];

let dataEntries = [
  {
    id: uuidv4(),
    formId: forms[0].id,
    userId: "demo-user",
    status: "completed",
    deviceId: "demo-device",
    latitude: -15.7801,
    longitude: -47.8292,
    accuracy: 5.2,
    altitude: 1200,
    timestamp: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
    metadata: {
      appVersion: "1.0.0",
      formVersion: "1.0.0"
    },
    values: [
      {
        fieldId: forms[0].fields[0].id,
        value: "João Silva"
      },
      {
        fieldId: forms[0].fields[1].id,
        value: "buraco"
      },
      {
        fieldId: forms[0].fields[4].id,
        value: "Buraco grande na esquina, prejudicando o trânsito"
      }
    ]
  }
];

let syncQueue = [];

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'GeoCOLLECT API funcionando perfeitamente!',
    version: '1.0.0'
  });
});

// Forms endpoints
app.get('/api/forms', (req, res) => {
  res.json(forms);
});

app.get('/api/forms/:id', (req, res) => {
  const form = forms.find(f => f.id === req.params.id);
  if (!form) {
    return res.status(404).json({ error: 'Formulário não encontrado' });
  }
  res.json(form);
});

app.post('/api/forms', (req, res) => {
  const newForm = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req.body
  };
  forms.push(newForm);
  res.status(201).json(newForm);
});

app.put('/api/forms/:id', (req, res) => {
  const index = forms.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Formulário não encontrado' });
  }
  forms[index] = { ...forms[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(forms[index]);
});

app.delete('/api/forms/:id', (req, res) => {
  const index = forms.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Formulário não encontrado' });
  }
  forms.splice(index, 1);
  res.status(204).send();
});

// Data entries endpoints
app.get('/api/data', (req, res) => {
  res.json(dataEntries);
});

app.get('/api/data/:id', (req, res) => {
  const entry = dataEntries.find(e => e.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
  res.json(entry);
});

app.post('/api/data', (req, res) => {
  const newEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req.body
  };
  dataEntries.push(newEntry);
  res.status(201).json(newEntry);
});

app.put('/api/data/:id', (req, res) => {
  const index = dataEntries.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
  dataEntries[index] = { ...dataEntries[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(dataEntries[index]);
});

app.delete('/api/data/:id', (req, res) => {
  const index = dataEntries.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
  dataEntries.splice(index, 1);
  res.status(204).send();
});

// Sync endpoints
app.get('/api/sync/status', (req, res) => {
  res.json({
    pendingItems: syncQueue.filter(item => item.status === 'pending').length,
    failedItems: syncQueue.filter(item => item.status === 'failed').length,
    completedItems: syncQueue.filter(item => item.status === 'completed').length,
    totalItems: syncQueue.length,
    lastSync: new Date().toISOString()
  });
});

app.post('/api/sync/push', (req, res) => {
  const { data } = req.body;
  
  // Simular processamento de sync
  data.forEach(item => {
    const syncItem = {
      id: uuidv4(),
      ...item,
      status: 'completed',
      processedAt: new Date().toISOString()
    };
    syncQueue.push(syncItem);
  });
  
  res.json({ 
    message: 'Dados sincronizados com sucesso',
    processed: data.length 
  });
});

// Statistics endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    totalForms: forms.length,
    activeForms: forms.filter(f => f.isActive).length,
    totalEntries: dataEntries.length,
    completedEntries: dataEntries.filter(e => e.status === 'completed').length,
    pendingSync: syncQueue.filter(s => s.status === 'pending').length,
    lastActivity: new Date().toISOString()
  });
});

// Demo data endpoint
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'GeoCOLLECT - Sistema de Coleta de Dados Geográficos',
    description: 'Esta é uma demonstração da API do GeoCOLLECT, inspirada no ODK Collect',
    features: [
      'Formulários dinâmicos',
      'Coleta de dados offline',
      'Integração com GPS',
      'Captura de fotos',
      'Sincronização automática',
      'Mapas offline'
    ],
    endpoints: {
      health: 'GET /health',
      forms: 'GET /api/forms',
      data: 'GET /api/data',
      stats: 'GET /api/stats',
      sync: 'GET /api/sync/status'
    },
    sampleForm: forms[0],
    sampleData: dataEntries[0]
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: error.message || 'Erro interno do servidor' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GeoCOLLECT API rodando em http://localhost:${PORT}`);
  console.log(`📊 Estatísticas: http://localhost:${PORT}/api/stats`);
  console.log(`🔧 Saúde da API: http://localhost:${PORT}/health`);
  console.log(`📝 Demo completa: http://localhost:${PORT}/api/demo`);
  console.log(`\n✅ Servidor iniciado com sucesso!`);
  console.log(`\n📱 Formulários disponíveis: ${forms.length}`);
  console.log(`📋 Registros de exemplo: ${dataEntries.length}`);
});

module.exports = app;