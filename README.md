# Google Drive MCP Server

Servidor MCP (Model Context Protocol) para gestión de múltiples cuentas de Google Drive con acceso de solo lectura.

## 🎯 Características

- ✅ **Multi-cuenta**: Gestiona múltiples cuentas de Google Drive simultáneamente
- ✅ **Autenticación segura**: Service Account con permisos de solo lectura
- ✅ **Operaciones de archivos**: Listar, buscar y obtener contenido
- ✅ **Soporta Google Workspace**: Docs, Sheets, Slides
- ✅ **Archivos de texto**: TXT, Markdown
- ✅ **Logging estructurado**: Winston con múltiples niveles
- ✅ **Validación robusta**: Zod schemas para configuración
- ✅ **API key opcional**: Autenticación de requests MCP

## 📁 Estructura del Proyecto

```
src/
  config/
    config-loader.ts    # Gestión de configuración de Drives
    types.ts            # Tipos y esquemas Zod

  services/
    drive-service.ts    # Servicio de Google Drive API

  utils/
    logger.ts           # Sistema de logging con Winston

  mcp/
    auth.ts             # Autenticación de requests MCP
    server.ts           # Configuración del servidor MCP
    tools-definition.ts # Definición de herramientas MCP
    tools-handler.ts    # Lógica de ejecución de herramientas

  index.ts              # Entry point del servidor
```

## 🚀 Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/andresfrei/mcp-drive.git
cd mcp-drive

# Instalar dependencias
pnpm install

# Configurar environment (opcional)
cp .env.example .env
nano .env

# Desarrollo (con hot reload)
pnpm dev

# Build
pnpm build

# Producción
pnpm start
```

## ⚙️ Configuración

### 1. Service Account de Google

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Google Drive API
3. Crear Service Account y descargar JSON
4. Compartir carpetas/archivos de Drive con el email del Service Account
5. Guardar JSON en `credentials/`

### 2. Archivo de Configuración

El servidor usa `drives-config.json` para gestionar cuentas:

```json
{
  "drives": {
    "personal": {
      "name": "Drive Personal",
      "description": "Mi Drive personal",
      "serviceAccountPath": "./credentials/personal-sa.json"
    },
    "work": {
      "name": "Drive Trabajo",
      "description": "Cuenta corporativa",
      "serviceAccountPath": "./credentials/work-sa.json"
    }
  }
}
```

**Nota**: El archivo se crea automáticamente vacío si no existe. Usa la herramienta `add_drive` para agregar cuentas.

### 3. Variables de Entorno (Opcional)

```env
# Ruta personalizada del archivo de configuración
DRIVES_CONFIG_PATH=./drives-config.json

# Nivel de logging (debug, info, warn, error)
LOG_LEVEL=info

# API key para autenticación de requests MCP (opcional)
MCP_API_KEY=tu_api_key_seguro
```

## 🛠️ Herramientas MCP

### Gestión de Drives

#### `list_drives`

Lista todas las cuentas de Google Drive configuradas.

**Parámetros**: Ninguno

**Respuesta**:

```json
[
  {
    "id": "personal",
    "name": "Drive Personal",
    "description": "Mi Drive personal"
  }
]
```

#### `add_drive`

Agrega una nueva cuenta de Google Drive a la configuración.

**Parámetros**:

- `driveId` (string, requerido): ID único (ej: 'personal', 'work')
- `name` (string, requerido): Nombre descriptivo
- `description` (string, opcional): Descripción de la cuenta
- `serviceAccountPath` (string, requerido): Ruta al archivo JSON de Service Account

**Ejemplo**:

```json
{
  "driveId": "personal",
  "name": "Drive Personal",
  "description": "Mi cuenta personal",
  "serviceAccountPath": "./credentials/personal-sa.json"
}
```

#### `remove_drive`

Elimina una cuenta de Drive de la configuración.

**Parámetros**:

- `driveId` (string, requerido): ID del Drive a eliminar

### Operaciones de Archivos

#### `list_files`

Lista archivos de Google Drive con filtros opcionales.

**Parámetros**:

- `driveId` (string, opcional): ID del Drive (usa el primero si se omite)
- `folderId` (string, opcional): ID de carpeta específica
- `modifiedAfter` (string, opcional): Fecha ISO 8601
- `modifiedBefore` (string, opcional): Fecha ISO 8601
- `mimeType` (string, opcional): Tipo MIME específico
- `pageSize` (number, opcional): Límite de resultados (default: 100)

**Respuesta**:

```json
{
  "totalFiles": 5,
  "files": [
    {
      "id": "1abc...",
      "name": "Documento.docx",
      "mimeType": "application/vnd.google-apps.document",
      "modifiedTime": "2024-10-16T10:30:00Z",
      "size": "12345",
      "webViewLink": "https://drive.google.com/...",
      "parents": ["0BwwA4oUTeiV1TGRPeTVjaWRDY1E"]
    }
  ]
}
```

#### `get_file_content`

Obtiene el contenido de un archivo de Google Drive.

**Soporta**:

- Google Docs → exporta como texto plano
- Google Sheets → exporta como CSV
- Archivos de texto (.txt, .md) → descarga directa

**Parámetros**:

- `fileId` (string, requerido): ID del archivo
- `driveId` (string, opcional): ID del Drive

**Respuesta**:

```json
{
  "fileId": "1abc...",
  "fileName": "Documento.txt",
  "mimeType": "text/plain",
  "content": "Contenido del archivo...",
  "extractedAt": "2024-10-16T10:30:00Z"
}
```

#### `search_files`

Busca archivos por nombre en un Drive específico.

**Parámetros**:

- `driveId` (string, requerido): ID del Drive donde buscar
- `query` (string, requerido): Texto a buscar en nombres de archivo

**Respuesta**:

```json
{
  "query": "presupuesto",
  "totalResults": 3,
  "files": [
    {
      "id": "1abc...",
      "name": "Presupuesto 2024.xlsx",
      "mimeType": "application/vnd.google-apps.spreadsheet",
      "modifiedTime": "2024-10-16T10:30:00Z"
    }
  ]
}
```

## 🔒 Seguridad

- **Solo lectura**: Service Account con scope `drive.readonly`
- **Autenticación opcional**: Soporta API key via `MCP_API_KEY`
- **Validación robusta**: Esquemas Zod para todos los inputs
- **Logging seguro**: No expone credenciales en logs

## 📊 Logging

El servidor genera logs estructurados en JSON:

- **Consola**: Formato colorizado para desarrollo
- **error.log**: Solo errores críticos
- **combined.log**: Todos los niveles

Configurar nivel via `LOG_LEVEL` env variable.

## 🐳 Docker

```bash
# Build
docker build -t mcp-drive-server .

# Run
docker run -p 3000:3000 \
  -v $(pwd)/credentials:/app/credentials \
  -v $(pwd)/drives-config.json:/app/drives-config.json \
  --env-file .env \
  mcp-drive-server
```

## 🧪 Desarrollo

```bash
# Desarrollo con hot reload
pnpm dev

# Verificar tipos
pnpm build

# Ver logs de Docker (si aplica)
pnpm docker:logs

# Reiniciar contenedor
pnpm docker:restart
```

## 📝 Tipos MIME Soportados

### Google Workspace

- `application/vnd.google-apps.document` - Google Docs
- `application/vnd.google-apps.spreadsheet` - Google Sheets
- `application/vnd.google-apps.presentation` - Google Slides

### Archivos de Texto

- `text/plain` - Texto plano
- `text/markdown` - Markdown

### Formatos de Exportación

- `text/plain` - Docs exportados
- `text/csv` - Sheets exportados

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT.

## 🆘 Troubleshooting

### Error: "Service account file not found"

- Verifica que el archivo JSON existe en la ruta especificada
- Usa rutas absolutas o relativas correctas

### Error: "Unauthorized: Invalid API key"

- Verifica que `MCP_API_KEY` esté configurado correctamente
- El API key debe enviarse en `_meta.apiKey` del request

### No se pueden leer archivos

- Verifica que el Service Account tenga acceso (compartido con su email)
- Confirma que el scope sea `drive.readonly`
- Revisa permisos de la carpeta/archivo en Drive

### Logs no aparecen

- Configura `LOG_LEVEL=debug` para ver más detalles
- Verifica permisos de escritura en la carpeta del proyecto
