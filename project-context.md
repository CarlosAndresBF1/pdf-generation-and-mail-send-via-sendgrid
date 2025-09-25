# Sistema de Certificados - Context del Proyecto

## Características Principales Implementadas

### 1. Sistema de Carga Masiva de Attendees (Bulk Upload)

#### Funcionalidades
- ✅ **Procesamiento de archivos**: Soporte para CSV, XLS, XLSX
- ✅ **Validación de datos**: Validación completa usando class-validator
- ✅ **Detección de duplicados**: Por email y número de documento
- ✅ **Asociación automática con certificados**: Si se proporciona certificate_id
- ✅ **Manejo de errores detallado**: Reporte por fila con errores específicos
- ✅ **Transaccional**: Procesamiento fila por fila sin afectar otras
- ✅ **Normalización de columnas**: Mapeo automático de nombres de columnas en español/inglés

#### Endpoint
**POST** `/attendees/bulk-upload`
- **Autenticación**: JWT requerido
- **Content-Type**: `multipart/form-data`
- **Parámetros**: 
  - `file` (requerido): Archivo CSV/Excel
  - `updateExisting` (opcional): Boolean para actualizar duplicados

#### Archivos Creados
- `src/attendees/dto/bulk-upload-attendee.dto.ts` - DTOs con validaciones
- `src/attendees/services/file-processing.service.ts` - Lógica de procesamiento
- `src/attendees/services/file-processing.service.spec.ts` - Tests unitarios (9 tests)
- `docs/bulk-upload-system.md` - Documentación completa
- `examples/attendees-example.csv` - Archivo de ejemplo

#### Estadísticas de Respuesta
```typescript
{
  totalRecords: number;          // Total de registros procesados
  created: number;               // Nuevos asistentes creados
  updated: number;               // Asistentes actualizados
  errors: number;                // Número de errores
  errorDetails: Array<{          // Detalles de errores por fila
    row: number;
    data?: any;
    errors: string[];
  }>;
  certificatesAssociated: number; // Certificados asociados automáticamente
}
```

### 2. Sistema de Jobs Automatizado (Cron)

#### Funcionalidades
- ✅ **Procesamiento automático**: Cada 5 minutos usando @nestjs/schedule
- ✅ **Prevención de concurrencia**: Un job a la vez
- ✅ **Estadísticas automáticas**: Reporte de jobs procesados
- ✅ **Mantenimiento**: Limpieza automática cada hora

#### Archivos
- `src/jobs/services/job-scheduler.service.ts` - Servicio principal
- `src/jobs/services/job-scheduler.service.spec.ts` - Tests

### 3. Validaciones y Tipos de Datos

#### Normalización de Columnas
El sistema reconoce múltiples variaciones de nombres de columnas:

**Español**: `nombre completo`, `primer nombre`, `apellido`, `país`, `correo`, `género`
**Inglés**: `full_name`, `first_name`, `last_name`, `country`, `email`, `gender`
**Mixto**: `nombre_completo`, `primer_nombre`, `correo_electronico`

#### Transformaciones
- **certificate_id**: String → Number automáticamente
- **Emails**: Validación de formato
- **Campos requeridos**: Validación de no vacío

### 4. Integración con Base de Datos

#### Entidades Utilizadas
- `Attendee` - Datos de asistentes
- `Certificate` - Configuración de certificados
- `GeneratedCertificate` - Asociaciones attendee-certificate

#### Repository Pattern
- Inyección de dependencias con TypeORM
- Transacciones por fila para seguridad
- Búsqueda de duplicados optimizada

### 5. Testing

#### Cobertura de Tests
- **FileProcessingService**: 9 tests unitarios
  - Validación de archivos
  - Procesamiento CSV
  - Manejo de duplicados
  - Asociación de certificados
  - Validaciones de datos
  - Normalización de columnas

#### Mocks Implementados
- Repository mocks para todas las entidades
- File mocks para testing de upload
- Scenario testing para casos complejos

### 6. Documentación

#### Archivos de Documentación
- `docs/bulk-upload-system.md` - Guía completa del usuario
- `examples/attendees-example.csv` - Archivo de ejemplo con 10 registros
- README con ejemplos de cURL
- Swagger/OpenAPI completo

#### Ejemplos de Uso
```bash
# Upload básico
curl -X POST http://localhost:3000/api/attendees/bulk-upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@attendees.csv"

# Upload con actualización de duplicados
curl -X POST http://localhost:3000/api/attendees/bulk-upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@attendees.csv" \
  -F "updateExisting=true"
```

### 7. Características Técnicas

#### Librerías Utilizadas
- **multer**: Manejo de archivos multipart
- **papaparse**: Parsing de CSV
- **xlsx**: Procesamiento de Excel
- **class-validator**: Validaciones de DTO
- **class-transformer**: Transformación de datos

#### Seguridad
- Validación de tipos de archivo (extensiones)
- Límites de tamaño de archivo
- Validación de datos estricta
- Autenticación JWT requerida

#### Performance
- Procesamiento streaming para archivos grandes
- Validación en memoria eficiente
- Transacciones optimizadas
- Error handling sin bloqueo

### 8. Configuración ESLint

#### Correcciones Aplicadas
- Tipos seguros (no `any` sin control)
- Formateo consistente
- Imports organizados
- Unused variables eliminadas
- Tests con eslint-disable apropiados

### 9. Próximas Mejoras Sugeridas

#### Funcionalidades Adicionales
- [ ] Procesamiento en background para archivos muy grandes (>10K registros)
- [ ] Preview de datos antes de procesar
- [ ] Templates de archivos descargables
- [ ] Histórico de uploads
- [ ] Webhook notifications para completion
- [ ] Rollback de uploads erróneos

#### Optimizaciones
- [ ] Bulk database operations
- [ ] Streaming para archivos grandes
- [ ] Progress tracking con WebSockets
- [ ] Caching de validaciones

---

## Estructura de Archivos del Sistema

```
src/
├── attendees/
│   ├── controllers/
│   │   └── attendees.controller.ts          # + bulk-upload endpoint
│   ├── dto/
│   │   └── bulk-upload-attendee.dto.ts      # DTOs para bulk upload
│   ├── services/
│   │   ├── attendees.service.ts
│   │   ├── file-processing.service.ts       # ✨ Nuevo servicio
│   │   └── file-processing.service.spec.ts  # ✨ Tests completos
│   └── modules/
│       └── attendees.module.ts              # + FileProcessingService
├── jobs/
│   └── services/
│       └── job-scheduler.service.ts         # ✨ Cron automatizado
docs/
└── bulk-upload-system.md                   # ✨ Documentación completa
examples/
└── attendees-example.csv                   # ✨ Archivo de ejemplo
```

## Comandos Útiles

```bash
# Ejecutar tests del bulk upload
npm test -- file-processing.service.spec.ts

# Ejecutar aplicación
npm run start:dev

# Ver documentación API
http://localhost:3000/api/docs

# Verificar cron jobs (logs)
# Los jobs se ejecutan cada 5 minutos automáticamente
```