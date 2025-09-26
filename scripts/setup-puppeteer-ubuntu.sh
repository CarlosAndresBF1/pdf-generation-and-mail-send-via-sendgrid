#!/bin/bash

# Script completo de configuración para Puppeteer en Ubuntu Server
# Debe ejecutarse como root o con sudo

echo "🚀 Configurando Puppeteer para Ubuntu Server..."

# 1. Actualizar sistema
echo "📦 Updating system packages..."
apt-get update

# 2. Instalar dependencias básicas
echo "🔧 Installing basic dependencies..."
apt-get install -y wget gnupg

# 3. Agregar repositorio de Google Chrome
echo "📥 Adding Google Chrome repository..."
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list

# 4. Actualizar e instalar Chrome
echo "🌐 Installing Google Chrome..."
apt-get update
apt-get install -y google-chrome-stable

# 5. Instalar dependencias específicas de Puppeteer
echo "🎭 Installing Puppeteer dependencies..."
apt-get install -y \
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

# 6. Instalar fuentes adicionales
echo "🔤 Installing additional fonts..."
apt-get install -y \
    fonts-dejavu-core \
    fonts-freefont-ttf \
    fonts-liberation \
    fonts-noto-cjk \
    fonts-noto-hinted \
    fonts-noto-unhinted \
    ttf-ubuntu-font-family

# 7. Verificar instalación
echo "🔍 Verifying installation..."
google-chrome --version
ldconfig -p | grep libatk-1.0.so.0

# 8. Crear usuario para Puppeteer (opcional, recomendado para seguridad)
echo "👤 Setting up puppeteer user..."
if ! id "puppeteer" &>/dev/null; then
    useradd -r -g audio,video puppeteer
    mkdir -p /home/puppeteer/Downloads
    chown -R puppeteer:puppeteer /home/puppeteer
fi

echo "✅ Puppeteer setup completed!"
echo "🔄 Please restart your Node.js application."
echo ""
echo "💡 Test Chrome installation with:"
echo "   google-chrome --headless --disable-gpu --dump-dom https://google.com"