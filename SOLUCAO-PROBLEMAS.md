# 🔧 Solução de Problemas - GeoCOLLECT

## ❌ Erro: Porta já em uso (EADDRINUSE)

### 🔍 **Sintoma:**
```
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1463:16)
    at listenInCluster (node:net:1511:12)
    at Server.listen (node:net:1599:7)
```

### ✅ **Soluções:**

#### 1. **Usar porta diferente (Mais Rápido)**
```bash
# Executar na porta 3001
PORT=3001 node demo-server.js

# Ou porta 8000
PORT=8000 node demo-server.js

# Testar
curl http://localhost:3001/health
```

#### 2. **Parar processo na porta 3000**
```bash
# Encontrar e parar processo (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Ou usar pkill
pkill -f "demo-server.js"
pkill -f "node.*3000"

# Depois executar normalmente
node demo-server.js
```

#### 3. **Usar netstat para verificar portas**
```bash
# Ver processos usando portas
netstat -tulpn | grep :3000

# Ou
ss -tulpn | grep :3000
```

---

## ❌ Erro: Módulo não encontrado

### 🔍 **Sintoma:**
```
Error: Cannot find module 'express'
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:956:15)
```

### ✅ **Solução:**
```bash
# Instalar dependências
npm install

# Se continuar com erro, limpar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## ❌ Erro: PostgreSQL não conecta

### 🔍 **Sintoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

### ✅ **Soluções:**

#### 1. **Usar servidor de demonstração**
```bash
# Não precisa de PostgreSQL
node demo-server.js
```

#### 2. **Instalar PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 3. **Criar banco de dados**
```bash
# Conectar como postgres
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE geocollect;
CREATE USER geocollect_user WITH PASSWORD 'geocollect123';
GRANT ALL PRIVILEGES ON DATABASE geocollect TO geocollect_user;
\q
```

---

## ❌ Erro: Permissão negada

### 🔍 **Sintoma:**
```
Error: EACCES: permission denied, mkdir '/uploads'
```

### ✅ **Solução:**
```bash
# Criar diretório com permissões
mkdir -p uploads
chmod 755 uploads

# Ou executar como sudo (não recomendado)
sudo node demo-server.js
```

---

## ❌ React Native: Metro não inicia

### 🔍 **Sintoma:**
```
Error: ENOSPC: System limit for number of file watchers reached
```

### ✅ **Solução:**
```bash
# Aumentar limite de watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Limpar cache
npx react-native start --reset-cache
```

---

## ❌ Android: Erro de Build

### 🔍 **Sintoma:**
```
Error: Could not find com.android.tools.build:gradle:7.4.2
```

### ✅ **Solução:**
```bash
# Limpar build Android
cd android
./gradlew clean
cd ..

# Reinstalar dependências
rm -rf node_modules
npm install

# Executar novamente
npm run android
```

---

## ❌ iOS: Pod Install falha

### 🔍 **Sintoma:**
```
[!] CocoaPods could not find compatible versions for pod "React-Core"
```

### ✅ **Solução:**
```bash
# Limpar pods
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod setup
pod install
cd ..

# Se continuar com erro
pod install --repo-update
```

---

## 🔧 Comandos de Diagnóstico

### **Verificar ambiente:**
```bash
# Versões dos softwares
node --version
npm --version
psql --version

# Portas em uso
netstat -tulpn | grep :3000
netstat -tulpn | grep :8081

# Processos Node.js
ps aux | grep node
```

### **Limpar tudo:**
```bash
# Parar todos os processos
pkill -f node
pkill -f metro

# Limpar caches
npm cache clean --force
npx react-native start --reset-cache

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### **Verificar logs:**
```bash
# Ver logs do servidor
tail -f server.log

# Ver logs do React Native
npx react-native log-android
npx react-native log-ios
```

---

## 🆘 Soluções Rápidas

### **Problema com porta:**
```bash
PORT=3001 node demo-server.js
```

### **Problema com banco:**
```bash
# Usar demo (sem banco)
node demo-server.js
```

### **Problema com React Native:**
```bash
# Resetar Metro
npx react-native start --reset-cache --verbose
```

### **Problema geral:**
```bash
# Reinstalar tudo
rm -rf node_modules package-lock.json
npm install
```

---

## 🧪 Testes de Funcionamento

### **Testar servidor:**
```bash
# Servidor funcionando?
curl http://localhost:3000/health

# Ou na porta alternativa
curl http://localhost:3001/health

# Resposta esperada:
# {"status":"OK","timestamp":"..."}
```

### **Testar API completa:**
```bash
# Ver demonstração
curl http://localhost:3001/api/demo | python3 -m json.tool

# Ver estatísticas
curl http://localhost:3001/api/stats | python3 -m json.tool
```

### **Testar React Native:**
```bash
# Metro rodando?
curl http://localhost:8081/status

# App conectado?
adb devices
```

---

## 📞 Suporte

Se os problemas persistirem:

1. **Verifique as versões** dos softwares
2. **Use o servidor de demonstração** (`node demo-server.js`)
3. **Consulte os logs** detalhados
4. **Reinicie o sistema** se necessário

### **Configuração mínima funcionando:**
```bash
# Apenas o essencial
npm install
node demo-server.js
# ✅ Servidor funcionando em http://localhost:3000
```

---

**🎯 Lembre-se: O servidor de demonstração funciona SEM PostgreSQL!**