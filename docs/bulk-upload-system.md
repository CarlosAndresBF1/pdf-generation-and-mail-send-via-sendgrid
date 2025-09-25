# Sistema de Carga Masiva de Attendees (Bulk Upload)

## Descripción
El sistema de carga masiva permite importar múltiples asistentes desde archivos CSV o Excel, con funcionalidades avanzadas como validación de datos, detección de duplicados, y asociación automática con certificados.

## Endpoint
**POST** `/attendees/bulk-upload`

### Autenticación
Requiere token JWT en el header `Authorization: Bearer <token>`

### Parámetros

#### Archivo (requerido)
- **Nombre del campo**: `file`
- **Tipo**: `multipart/form-data`
- **Formatos soportados**: CSV, XLS, XLSX
- **Tamaño máximo**: 10MB (configurable)

#### Query Parameters
- **updateExisting** (opcional): `boolean` - Default: `false`
  - `true`: Actualiza asistentes existentes si se encuentran duplicados por email o documento
  - `false`: Marca como error los duplicados

### Estructura del Archivo

#### Columnas Requeridas
| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `fullName` | string | Nombre completo del asistente | "Juan Carlos Pérez García" |
| `email` | string | Correo electrónico (debe ser válido) | "juan.perez@example.com" |
| `country` | string | País del asistente | "Colombia" |
| `documentType` | string | Tipo de documento | "CC", "CE", "Pasaporte" |
| `documentNumber` | string | Número de documento | "12345678" |
| `gender` | string | Género | "M", "F", "Masculino", "Femenino" |

#### Columnas Opcionales
| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `firstName` | string | Primer nombre (opcional) | "Juan Carlos" |
| `lastName` | string | Apellido (opcional) | "Pérez García" |
| `certificateId` | number | ID del certificado a asociar | 1 |

#### Nombres de Columnas Alternativos
El sistema normaliza automáticamente los nombres de columnas. Estos son algunos nombres alternativos aceptados:

- **Nombre completo**: `nombre completo`, `nombre_completo`, `full_name`, `fullname`
- **Primer nombre**: `nombre`, `primer nombre`, `primer_nombre`, `first_name`, `firstname`
- **Apellido**: `apellido`, `apellidos`, `last_name`, `lastname`
- **País**: `país`, `pais`, `country`
- **Tipo de documento**: `tipo documento`, `tipo_documento`, `document_type`, `documenttype`
- **Número de documento**: `numero documento`, `numero_documento`, `número documento`, `número_documento`, `document_number`, `documentnumber`
- **Género**: `genero`, `género`, `sexo`, `gender`
- **Email**: `correo`, `email`, `correo electronico`, `correo_electronico`
- **ID de certificado**: `certificate_id`, `certificateid`, `id certificado`, `id_certificado`

### Ejemplo de Archivo CSV

```csv
fullName,firstName,lastName,email,country,documentType,documentNumber,gender,certificateId
Juan Carlos Pérez García,Juan Carlos,Pérez García,juan.perez@example.com,Colombia,CC,12345678,M,1
María Elena Rodríguez López,María Elena,Rodríguez López,maria.rodriguez@example.com,México,RFC,87654321,F,1
John Smith,,Smith,john.smith@example.com,Estados Unidos,Passport,A12345678,Male,2
Ana Sofía González,Ana Sofía,González,ana.gonzalez@example.com,Colombia,CC,11223344,F,
Carlos Mendoza,Carlos,Mendoza,carlos.mendoza@example.com,Perú,DNI,98765432,M,1
```

### Respuesta Exitosa

```json
{
  "totalRecords": 5,
  "created": 4,
  "updated": 1,
  "errors": 0,
  "errorDetails": [],
  "certificatesAssociated": 3
}
```

### Respuesta con Errores

```json
{
  "totalRecords": 3,
  "created": 1,
  "updated": 0,
  "errors": 2,
  "errorDetails": [
    {
      "row": 2,
      "data": {
        "fullName": "",
        "email": "invalid-email",
        "country": "Colombia"
      },
      "errors": [
        "fullName should not be empty",
        "email must be an email"
      ]
    },
    {
      "row": 3,
      "data": {
        "fullName": "Pedro García",
        "email": "pedro@example.com",
        "certificateId": 999
      },
      "errors": [
        "Certificate ID 999 no existe"
      ]
    }
  ],
  "certificatesAssociated": 0
}
```

### Códigos de Estado HTTP

- **201 Created**: Archivo procesado exitosamente
- **400 Bad Request**: Error en el archivo o formato no soportado
- **401 Unauthorized**: Token JWT no válido o ausente
- **413 Payload Too Large**: Archivo excede el tamaño máximo permitido

### Características del Sistema

#### Validaciones
- ✅ Formato de email válido
- ✅ Campos requeridos no vacíos
- ✅ Existencia de certificate_id (si se proporciona)
- ✅ Formato de archivo soportado

#### Detección de Duplicados
- **Criterios**: Email OR número de documento
- **Comportamiento con `updateExisting=false`**: Marca como error
- **Comportamiento con `updateExisting=true`**: Actualiza el registro existente

#### Asociación Automática con Certificados
- Si se proporciona `certificateId` válido, se crea automáticamente una entrada en `generated_certificates`
- Evita duplicados: No crea la asociación si ya existe
- Campos por defecto en la asociación:
  - `s3Url`: Vacío (se llenará al generar el PDF)
  - `generatedAt`: Fecha actual
  - `isSent`: false

#### Procesamiento Transaccional
- Cada fila se procesa individualmente
- Los errores en una fila no afectan el procesamiento de las demás
- Se proporciona un reporte detallado de éxitos y errores

### Ejemplos de Uso

#### cURL con archivo CSV
```bash
curl -X POST \
  http://localhost:3000/api/attendees/bulk-upload \
  -H "Authorization: Bearer <tu-jwt-token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@attendees.csv" \
  -F "updateExisting=true"
```

#### cURL con archivo Excel
```bash
curl -X POST \
  http://localhost:3000/api/attendees/bulk-upload \
  -H "Authorization: Bearer <tu-jwt-token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@attendees.xlsx"
```

### Buenas Prácticas

1. **Preparación del archivo**:
   - Usar la primera fila como header con nombres de columnas
   - Evitar celdas vacías en campos requeridos
   - Validar emails antes de cargar

2. **Gestión de errores**:
   - Revisar el campo `errorDetails` en la respuesta
   - Corregir errores y volver a cargar solo las filas problemáticas

3. **Rendimiento**:
   - Procesar archivos en lotes de máximo 1000 registros
   - Para archivos grandes, considerar dividir en múltiples uploads

4. **Certificados**:
   - Verificar que los `certificate_id` existan antes de cargar
   - El campo es opcional: se puede asociar certificados después

### Limitaciones

- Máximo 10,000 registros por archivo (configurable)
- Solo formatos CSV, XLS, XLSX
- Los certificados deben existir previamente en el sistema
- No se pueden crear nuevos tipos de documento desde el bulk upload

### Troubleshooting

#### Error: "Formato de archivo no soportado"
- Verificar que el archivo tenga extensión .csv, .xls o .xlsx
- Asegurarse de que el archivo no esté corrupto

#### Error: "Attendee ya existe"
- Usar `updateExisting=true` para actualizar registros existentes
- O cambiar el email/documento del asistente duplicado

#### Error: "Certificate ID X no existe"
- Verificar que el certificado existe en la base de datos
- Crear el certificado primero o remover la columna `certificateId`

#### Archivo CSV no se parsea correctamente
- Verificar que use comas como separador
- Asegurarse de que los campos con comas estén entre comillas
- Verificar la codificación del archivo (UTF-8 recomendado)