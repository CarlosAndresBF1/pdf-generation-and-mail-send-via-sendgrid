#!/bin/bash

# Script para instalar dependencias de Puppeteer en Ubuntu
# Soluciona: libatk-1.0.so.0: cannot open shared object file

echo "🔧 Installing Puppeteer dependencies for Ubuntu..."

# Actualizar lista de paquetes
sudo apt-get update

# Instalar dependencias esenciales de Chrome/Chromium
sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
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
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

# Instalar dependencias adicionales para multimedia
sudo apt-get install -y \
    gconf-service \
    libgconf-2-4 \
    libxfont1 \
    libxfont2

# Dependencias específicas para sistemas headless
sudo apt-get install -y \
    xvfb \
    x11vnc \
    x11-xkb-utils \
    xfonts-100dpi \
    xfonts-75dpi \
    xfonts-scalable \
    xfonts-base

echo "✅ All Puppeteer dependencies installed successfully!"
echo "🔄 You may need to restart your Node.js application."

# Verificar instalación
echo "🔍 Verifying installation..."
ldconfig -p | grep libatk-1.0.so.0 && echo "✅ libatk-1.0.so.0 found" || echo "❌ libatk-1.0.so.0 not found"