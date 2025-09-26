# Guía de Instalación para Servidor Ubuntu

## ⚠️ Problema con Puppeteer en Ubuntu

### **Error Común:**
```
/chrome: error while loading shared libraries: libatk-1.0.so.0: cannot open shared object file: No such file or directory
```

### **🚀 Soluciones (en orden de preferencia):**

#### **Opción 1: Script Rápido (Recomendado)**
```bash
# Solo instala las dependencias esenciales
sudo ./scripts/fix-puppeteer-deps.sh

# Reiniciar la aplicación Node.js
pm2 restart certification_mails  # o como tengas configurado
```

#### **Opción 2: Instalación Completa con Chrome**
```bash
# Instala Chrome completo + todas las dependencias
sudo ./scripts/setup-puppeteer-ubuntu.sh

# Probar que funciona
google-chrome --headless --disable-gpu --dump-dom https://google.com
```

#### **Opción 3: Manual (si los scripts no funcionan)**
```bash
# Instalar solo la librería que falta
sudo apt-get update
sudo apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libnss3 libxss1 libasound2

# Verificar instalación
ldconfig -p | grep libatk-1.0.so.0
```

---

## 🔧 Problema con AWS SDK (Node v22.19.0)

### **Error:**
```
error TS2305: Module '"@aws-sdk/client-s3"' has no exported member 'S3Client'
```

### **Solución:**
```bash
# Usar versión fija y estable
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
npm run build
```

---

## 🐳 Alternativa Docker (Recomendada para Producción)

```dockerfile
FROM node:22.19.0-slim

# Instalar dependencias del sistema para Puppeteer
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get install -y \
    google-chrome-stable \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgbm1 \
    libnss3 \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Usuario no-root para seguridad
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

USER pptruser
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

---

## ✅ Verificaciones Post-Instalación

```bash
# 1. Verificar dependencias del sistema
ldconfig -p | grep libatk-1.0.so.0

# 2. Probar Chrome directamente
google-chrome --headless --disable-gpu --dump-dom https://google.com

# 3. Verificar que Node.js funciona
node --version  # Debe ser v22.19.0

# 4. Probar compilación
npm run build

# 5. Probar que el servicio PDF funciona
# (hacer una llamada de prueba al endpoint de generación)
```

---

## 📝 Notas Importantes

- **Ubuntu 20.04/22.04**: Scripts probados y funcionando
- **Permisos**: Los scripts necesitan `sudo` para instalar paquetes
- **Memoria**: Puppeteer necesita ~512MB RAM para funcionar
- **Espacio**: Chrome requiere ~200MB de espacio en disco
- **Seguridad**: En producción, usar usuario no-root para Puppeteer

---

**Última actualización**: 2025-09-26  
**Probado en**: Ubuntu 20.04, Ubuntu 22.04, Node.js v22.19.0