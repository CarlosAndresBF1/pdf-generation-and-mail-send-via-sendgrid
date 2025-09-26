#!/bin/bash

# Script para auditar y reparar jobs que se enviaron sin PDFs
# Usar después de resolver problemas de Puppeteer en Ubuntu

API_URL="${API_URL:-http://localhost:3000}"
JWT_TOKEN="${JWT_TOKEN:-your_jwt_token_here}"

echo "🔍 AUDITORÍA DE JOBS VS S3"
echo "========================="
echo ""
echo "API URL: $API_URL"
echo "JWT Token: ${JWT_TOKEN:0:20}..."
echo ""

# 1. Ejecutar auditoría
echo "📊 Paso 1: Ejecutando auditoría de jobs SENT vs archivos S3..."
AUDIT_RESPONSE=$(curl -s -X GET \
  "$API_URL/jobs/audit/missing-pdfs" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ $? -ne 0 ]; then
    echo "❌ Error al ejecutar auditoría"
    exit 1
fi

echo "✅ Auditoría completada"
echo ""

# Parsear respuesta usando jq si está disponible
if command -v jq &> /dev/null; then
    TOTAL_SENT=$(echo "$AUDIT_RESPONSE" | jq -r '.totalSentJobs')
    JOBS_WITH_VALID_PDFS=$(echo "$AUDIT_RESPONSE" | jq -r '.jobsWithValidPdfs')
    JOBS_WITH_MISSING_PDFS=$(echo "$AUDIT_RESPONSE" | jq -r '.jobsWithMissingPdfs')
    
    echo "📈 RESULTADOS DE AUDITORÍA:"
    echo "   - Total jobs SENT: $TOTAL_SENT"
    echo "   - Jobs con PDFs válidos: $JOBS_WITH_VALID_PDFS"
    echo "   - Jobs con PDFs faltantes: $JOBS_WITH_MISSING_PDFS"
    echo ""
    
    if [ "$JOBS_WITH_MISSING_PDFS" -gt 0 ]; then
        echo "⚠️  Se encontraron $JOBS_WITH_MISSING_PDFS jobs que se enviaron sin PDF adjunto"
        echo ""
        
        # Extraer los IDs de jobs que necesitan ser reenviados
        JOB_IDS=$(echo "$AUDIT_RESPONSE" | jq -r '.missingPdfJobs[].jobId' | tr '\n' ',' | sed 's/,$//')
        JOB_IDS_ARRAY=$(echo "$AUDIT_RESPONSE" | jq -c '[.missingPdfJobs[].jobId]')
        
        echo "🔧 Jobs que necesitan reenvío: $JOB_IDS"
        echo ""
        
        # Mostrar detalles de algunos jobs problemáticos
        echo "📋 Detalles de jobs problemáticos (primeros 5):"
        echo "$AUDIT_RESPONSE" | jq -r '.missingPdfJobs[0:5][] | "   - Job \(.jobId): \(.attendeeName) (\(.attendeeEmail))"'
        echo ""
        
        # Preguntar si quiere reenviar
        read -p "¿Quieres reenviar estos $JOBS_WITH_MISSING_PDFS jobs? (y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 Paso 2: Reenviando jobs con PDFs faltantes..."
            
            RETRY_RESPONSE=$(curl -s -X POST \
              "$API_URL/jobs/repair/retry-missing-pdfs" \
              -H "Authorization: Bearer $JWT_TOKEN" \
              -H "Content-Type: application/json" \
              -d "{\"jobIds\": $JOB_IDS_ARRAY}")
            
            if [ $? -eq 0 ]; then
                RETRIED_JOBS=$(echo "$RETRY_RESPONSE" | jq -r '.retriedJobs')
                SKIPPED_JOBS=$(echo "$RETRY_RESPONSE" | jq -r '.skippedJobs')
                MESSAGE=$(echo "$RETRY_RESPONSE" | jq -r '.message')
                
                echo "✅ Reenvío completado:"
                echo "   - Jobs reenviados: $RETRIED_JOBS"
                echo "   - Jobs omitidos: $SKIPPED_JOBS"
                echo "   - Mensaje: $MESSAGE"
                echo ""
                echo "🎯 Los jobs han sido marcados como PENDING y serán procesados en el próximo ciclo"
                echo ""
                echo "🔍 Para procesar inmediatamente, ejecuta:"
                echo "   curl -X POST $API_URL/jobs/process-pending -H \"Authorization: Bearer $JWT_TOKEN\""
            else
                echo "❌ Error al reenviar jobs"
                exit 1
            fi
        else
            echo "⏭️  Reenvío cancelado por el usuario"
        fi
    else
        echo "🎉 ¡Excelente! Todos los jobs SENT tienen sus PDFs correspondientes en S3"
    fi
else
    echo "⚠️  jq no está instalado, mostrando respuesta raw:"
    echo "$AUDIT_RESPONSE"
fi

echo ""
echo "✅ Script completado"