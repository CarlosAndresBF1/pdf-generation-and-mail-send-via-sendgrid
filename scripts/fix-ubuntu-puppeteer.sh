#!/bin/bash

# Script todo-en-uno para solucionar Puppeteer en Ubuntu
# Ejecutar como: sudo ./scripts/fix-ubuntu-puppeteer.sh

echo "🔧 Solucionando problema de Puppeteer en Ubuntu..."
echo "Error objetivo: libatk-1.0.so.0: cannot open shared object file"
echo ""

# Detectar versión de Ubuntu
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    echo "📋 Sistema detectado: $NAME $VERSION"
else
    echo "⚠️  No se pudo detectar la versión de Ubuntu"
fi

# Actualizar repositorios
echo "📦 Actualizando repositorios..."
apt-get update -qq

# Instalar dependencias esenciales en orden
echo "🎯 Instalando libatk-1.0.so.0 y dependencias..."
apt-get install -y --no-install-recommends \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libnss3 \
    libxss1 \
    libasound2 \
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

# Verificar instalación de la librería específica
echo ""
echo "🔍 Verificando instalación..."
if ldconfig -p | grep -q libatk-1.0.so.0; then
    echo "✅ libatk-1.0.so.0 instalada correctamente"
else
    echo "❌ libatk-1.0.so.0 no encontrada - instalación falló"
    exit 1
fi

# Instalar fuentes adicionales para mejorar PDFs
echo "🔤 Instalando fuentes adicionales..."
apt-get install -y --no-install-recommends \
    fonts-dejavu-core \
    fonts-freefont-ttf \
    fonts-liberation \
    ttf-ubuntu-font-family

# Limpiar caché de apt
echo "🧹 Limpiando caché..."
apt-get clean
rm -rf /var/lib/apt/lists/*

echo ""
echo "✅ ¡Instalación completada exitosamente!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Reiniciar tu aplicación Node.js"
echo "   2. Los jobs de PDF deberían funcionar ahora"
echo "   3. Monitorear logs para confirmar que no hay más errores"
echo ""
echo "🔧 Si necesitas más ayuda:"
echo "   - Revisar logs: tail -f /var/log/tu-app.log"
echo "   - Probar manualmente: node -e \"require('puppeteer').launch()\""
echo ""
echo "🎯 Problema solucionado: libatk-1.0.so.0 ahora disponible"