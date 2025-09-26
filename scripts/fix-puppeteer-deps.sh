#!/bin/bash

# Script simple para instalar solo las dependencias básicas de Puppeteer
# Para casos donde no se puede/quiere instalar Chrome completo

echo "🔧 Installing essential Puppeteer dependencies..."

# Actualizar paquetes
sudo apt-get update

# Instalar la librería específica que falta y sus dependencias
sudo apt-get install -y \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libnss3 \
    libxss1 \
    libasound2

# Instalar dependencias adicionales comunes
sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libglib2.0-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

echo "✅ Dependencies installed!"
echo "🔄 Restart your Node.js application to test."

# Verificar que la librería específica esté disponible
if ldconfig -p | grep -q libatk-1.0.so.0; then
    echo "✅ libatk-1.0.so.0 is now available"
else
    echo "❌ libatk-1.0.so.0 still not found - may need full Chrome installation"
fi