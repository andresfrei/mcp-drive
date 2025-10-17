# Google Drive MCP Server

Servidor MCP (Model Context Protocol) modernizado para gestión de múltiples cuentas de Google Drive con acceso de solo lectura.

## 🎯 Características

- ✅ **StreamableHTTP Transport**: Arquitectura stateless HTTP moderna (reemplaza SSE deprecado)
- ✅ **MCP SDK v1.19.1**: Usando McpServer high-level API con validación automática
- ✅ **Multi-cliente**: Múltiples clientes pueden conectarse simultáneamente (stateless)
- ✅ **Puerto configurable**: Ideal para VPS con múltiples servicios MCP
- ✅ **Multi-cuenta**: Gestiona múltiples cuentas de Google Drive simultáneamente
- ✅ **7 Herramientas MCP**: Incluyendo listado recursivo de carpetas
- ✅ **Arquitectura modular**: Tools organizadas en módulos independientes
- ✅ **Autenticación segura**: Query parameter o header API key
- ✅ **Operaciones de archivos**: Listar, buscar, recursivo y obtener contenido
- ✅ **Soporta Google Workspace**: Docs, Sheets, Slides
- ✅ **Archivos de texto**: TXT, Markdown
- ✅ **Logging estructurado**: Winston con múltiples niveles
- ✅ **Validación robusta**: Zod schemas en todas las herramientas
- ✅ **Path alias @/**: Imports absolutos desde `src/`
- ✅ **Oxlint + Prettier**: Linting ultrarrápido y formato consistente
- ✅ **Docker-ready**: Configuración lista para deployment en VPS

## 📁 Estructura del Proyecto

```
src/
  config/
    config-loader.ts    # Gestión de configuración de Drives
    types.ts            # Tipos y esquemas Zod

  services/
    drive-service.ts    # Servicio de Google Drive API (incluye recursivo)

  utils/
    logger.ts           # Sistema de logging con Winston

  mcp/
    auth.ts             # Autenticación de requests MCP
    server.ts           # Configuración del servidor MCP (33 líneas)
    tools/              # 🆕 Herramientas modularizadas
      index.ts          # Exportador central
      list-drives.ts    # Listar cuentas configuradas
      add-drive.ts      # Agregar cuenta
      remove-drive.ts   # Eliminar cuenta
      list-files.ts     # Listar archivos con filtros
      list-files-recursive.ts  # 🆕 Listado recursivo
      get-file-content.ts      # Obtener contenido
      search-files.ts          # Buscar por nombre

  index.ts              # Entry point del servidor

tests/
  test-mcp-client.ts    # Test de conexión general
  test-recursive.ts     # Test de listado recursivo
  test-drive.ts         # Test de API de Drive
  README.md             # Documentación de tests
```

## 🚀 Instalación y Deployment

### Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/andresfrei/mcp-google-drive-server.git
cd mcp-google-drive-server

# Instalar dependencias
pnpm install

# Configurar environment
cp .env.example .env
nano .env

# Desarrollo (con hot reload)
pnpm dev

# El servidor estará disponible en http://localhost:3001
```

### Producción con Docker

```bash
# Build y run con docker-compose
docker-compose up -d

# Ver logs
docker-compose logs -f mcp-drive

# Detener
docker-compose down
```

### VPS con Múltiples MCPs

Para ejecutar varios servidores MCP en el mismo VPS, configura diferentes puertos:

```bash
# MCP Drive en puerto 3001
MCP_DRIVE_PORT=3001 docker-compose up -d

# En otro directorio, otro MCP en puerto 3002
cd ../otro-mcp && MCP_OTRO_PORT=3002 docker-compose up -d
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

### 3. Variables de Entorno

```env
# Configuración del servidor HTTP
MCP_DRIVE_PORT=3001          # Puerto del servidor (default: 3001)
MCP_DRIVE_HOST=0.0.0.0       # Host de escucha (0.0.0.0 para Docker)

# Configuración de Drives
DRIVES_CONFIG_PATH=./drives-config.json

# Nivel de logging (debug, info, warn, error)
LOG_LEVEL=info

# API key para autenticación de requests MCP (opcional)
MCP_API_KEY=tu_api_key_seguro
```

## 🛠️ Herramientas MCP

El servidor expone **7 herramientas** vía protocolo MCP:

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
  "totalFiles": 3,
  "files": [
    {
      "id": "1abc...",
      "name": "Presupuesto 2024.xlsx",
      "mimeType": "application/vnd.google-apps.spreadsheet",
      "modifiedTime": "2024-10-16T10:30:00Z",
      "webViewLink": "https://drive.google.com/..."
    }
  ]
}
```

#### `list_files_recursive` 🆕

Lista recursivamente todos los archivos y subcarpetas dentro de una carpeta, incluyendo información de profundidad y ruta completa.

**Parámetros**:

- `folderId` (string, requerido): ID de la carpeta raíz desde donde iniciar
- `driveId` (string, opcional): ID del Drive (usa el primero si se omite)
- `maxDepth` (number, opcional): Profundidad máxima de recursión (default: 10)

**Respuesta**:

```json
{
  "totalItems": 166,
  "items": [
    {
      "id": "1abc...",
      "name": "CONTABILIDAD",
      "mimeType": "application/vnd.google-apps.folder",
      "modifiedTime": "2024-10-16T10:30:00Z",
      "size": "0",
      "webViewLink": "https://drive.google.com/...",
      "parents": ["0BwwA4oUTeiV1TGRPeTVjaWRDY1E"],
      "depth": 0,
      "path": "/COMNET/1 - CONTABILIDAD"
    },
    {
      "id": "2def...",
      "name": "Reporte.pdf",
      "mimeType": "application/pdf",
      "modifiedTime": "2024-10-15T14:20:00Z",
      "size": "470883",
      "webViewLink": "https://drive.google.com/...",
      "parents": ["1abc..."],
      "depth": 2,
      "path": "/COMNET/1 - CONTABILIDAD/DOCUMENTOS/Reporte.pdf"
    }
  ]
}
```

**Características**:

- ✅ Recorre toda la estructura jerárquica (DFS - Depth-First Search)
- ✅ Incluye campo `depth` (nivel de anidación, 0 = raíz)
- ✅ Incluye campo `path` (ruta completa desde carpeta inicial)
- ✅ Detecta automáticamente carpetas y archivos
- ✅ Respeta límite `maxDepth` para prevenir recursión infinita
- ✅ Ordena resultados: carpetas primero, luego por nombre
- ✅ Límite de 1000 items por nivel (máximo de Google Drive API)

## 🌐 Endpoints HTTP

El servidor expone los siguientes endpoints:

### Health Check

```bash
GET http://localhost:3001/health

# Respuesta
{
  "status": "healthy",
  "timestamp": "2024-10-16T10:30:00.000Z"
}
```

### Conexión MCP (StreamableHTTP)

```bash
GET http://localhost:3001/mcp?apiKey=tu-api-key-aqui

# Establece conexión StreamableHTTP para comunicación MCP
# Autenticación vía query parameter (recomendado) o header X-API-Key
```

**Nota sobre SSE**: El transporte SSE (Server-Sent Events) está deprecado en MCP SDK v1.19+. Use StreamableHTTP.

## 🔌 Conectar desde Cliente

### Opción 1: StreamableHTTP (Recomendado) 🆕

**Transport moderno stateless para cualquier aplicación:**

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Conectar con autenticación por query parameter
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3001/mcp?apiKey=tu-api-key-aqui")
);

const client = new Client(
  {
    name: "my-app",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

await client.connect(transport);

// Listar herramientas disponibles (7 tools)
const tools = await client.listTools();
console.log(`Tools disponibles: ${tools.tools.length}`);

// Ejecutar herramienta
const result = await client.callTool({
  name: "list_drives",
  arguments: {},
});

console.log(result);

// Listar recursivamente una carpeta
const recursiveResult = await client.callTool({
  name: "list_files_recursive",
  arguments: {
    folderId: "1AdO2achPP4Kgz4AGmKw2C4wKF49Ce-KC",
    driveId: "comnet-manuales",
    maxDepth: 5,
  },
});

await client.close();
```

### Opción 2: Cliente NestJS (Orquestador)

**Recomendado para aplicaciones que necesitan múltiples MCPs:**

```typescript
// src/mcp/mcp.config.ts (NestJS)
import { registerAs } from "@nestjs/config";

export default registerAs("mcp", () => ({
  servers: {
    googleDrive: {
      name: "google-drive-local",
      transport: {
        type: "streamableHttp", // 🆕 Cambio de "sse" a "streamableHttp"
        // Desarrollo: http://localhost:3001/mcp?apiKey=...
        // Producción Docker: http://mcp-drive:3001/mcp?apiKey=...
        url:
          process.env.MCP_DRIVE_URL ||
          `http://localhost:3001/mcp?apiKey=${process.env.MCP_DRIVE_API_KEY}`,
      },
      timeout: 30000,
    },
  },
}));

// src/mcp/mcp.service.ts
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL(config.transport.url)
);

await client.connect(transport);
```

📚 **Ver guía completa**: [`docs/NESTJS-CLIENT.md`](./docs/NESTJS-CLIENT.md)

### Características del Cliente

- ✅ **CORS habilitado**: Funciona desde cualquier dominio
- ✅ **API Key dual**: Via query parameter `?apiKey=...` (recomendado) o header `X-API-Key`
- ✅ **Stateless**: No mantiene sesiones, ideal para Docker/Kubernetes
- ✅ **Multi-cliente**: Múltiples clientes pueden conectarse simultáneamente
- ✅ **Retry automático**: SDK maneja reconexiones

## 🔒 Seguridad

- **Solo lectura**: Service Account con scope `drive.readonly`
- **Autenticación opcional**: Soporta API key via header `X-API-Key`
- **CORS configurado**: Permite conexiones desde clientes externos
- **Validación robusta**: Esquemas Zod para todos los inputs
- **Logging seguro**: No expone credenciales en logs

### Autenticación con API Key

**1. Configurar API key en servidor:**

```env
# .env
MCP_API_KEY=tu_api_key_super_secreto_aqui
```

**2. Enviar desde cliente:**

```typescript
// Opción 1: Query parameter (recomendado para StreamableHTTP)
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3001/mcp?apiKey=tu_api_key_super_secreto_aqui")
);

// Opción 2: Header (alternativa)
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3001/mcp"),
  {
    headers: {
      "X-API-Key": "tu_api_key_super_secreto_aqui",
    },
  }
);
```

**3. Comportamiento:**

- ✅ Si `MCP_API_KEY` NO está configurado → **Acceso libre** (desarrollo)
- 🔒 Si `MCP_API_KEY` está configurado → **Requiere header** `X-API-Key`

### Seguridad en Producción (VPS)

⚠️ **Importante**: Este servidor usa HTTP sin cifrado. Para producción:

1. **Reverse Proxy con SSL** (nginx/traefik)
2. **Firewall**: Restringir acceso por IP
3. **Rate Limiting**: Prevenir abuso
4. **API Key**: Habilitar autenticación

Ejemplo nginx con SSL:

```nginx
upstream mcp_drive {
    server localhost:3001;
}

server {
    listen 443 ssl http2;
    server_name mcp-drive.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Solo permitir IP del orquestador
    allow 192.168.1.100;
    deny all;

    location / {
        proxy_pass http://mcp_drive;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-API-Key $http_x_api_key;  # Pasar API key
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400;
    }
}
```

### CORS en Producción

Por defecto, CORS permite cualquier origen (`*`). Para producción, restringe dominios:

```typescript
// src/index.ts
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://tu-app.com" // Solo tu dominio
  );
  // ... resto
});
```

## 📊 Logging

El servidor genera logs estructurados en JSON:

- **Consola**: Formato colorizado para desarrollo
- **error.log**: Solo errores críticos
- **combined.log**: Todos los niveles

Configurar nivel via `LOG_LEVEL` env variable.

## 🐳 Docker

### Docker Compose (Recomendado)

```bash
# Levantar servicio
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener servicio
docker-compose down

# Reconstruir después de cambios
docker-compose up -d --build
```

### Docker Manual

```bash
# Build
docker build -t mcp-drive-server .

# Run
docker run -d \
  --name mcp-drive \
  -p 3001:3000 \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  -e LOG_LEVEL=info \
  -v $(pwd)/drives-config.json:/app/config/drives-config.json \
  -v $(pwd)/keys:/app/keys:ro \
  -v $(pwd)/logs:/app/logs \
  mcp-drive-server

# Ver logs
docker logs -f mcp-drive
```

### Múltiples Instancias en VPS

```bash
# Instancia 1 - Drive Personal (puerto 3001)
docker run -d --name mcp-drive-personal \
  -p 3001:3000 \
  -v $(pwd)/config-personal:/app/config \
  mcp-drive-server

# Instancia 2 - Drive Trabajo (puerto 3002)
docker run -d --name mcp-drive-work \
  -p 3002:3000 \
  -v $(pwd)/config-work:/app/config \
  mcp-drive-server
```

## 🧪 Desarrollo y Testing

```bash
# Desarrollo local con hot reload
pnpm dev
# Servidor en http://localhost:3001

# Linting con oxlint (ultrarrápido)
pnpm lint
pnpm lint:fix

# Formateo con Prettier
pnpm format
pnpm format:check

# Verificación completa (lint + format)
pnpm check

# Build para producción
pnpm build

# Ejecutar versión compilada
pnpm start

# Tests
pnpm test:client      # Test de conexión y tools básicas
pnpm test:recursive   # Test de listado recursivo
pnpm test:drive       # Test de Google Drive API
pnpm test:all         # Ejecutar todos los tests

# Ver logs de Docker
docker-compose logs -f

# Reiniciar contenedor
docker-compose restart

# Reconstruir imagen
docker-compose up -d --build
```

### Tests Disponibles

El proyecto incluye 3 tests completos en la carpeta `tests/`:

1. **test-mcp-client.ts**: Conexión general y herramientas básicas
2. **test-recursive.ts**: Validación de listado recursivo (166 items en estructura COMNET)
3. **test-drive.ts**: Pruebas directas con Google Drive API

📚 **Ver documentación completa**: [`tests/README.md`](./tests/README.md)

## 📊 Monitoreo

```bash
# Health check
curl http://localhost:3001/health

# Test de conexión MCP
pnpm test:client

# Logs en tiempo real
docker-compose logs -f mcp-drive

# Stats de recursos
docker stats mcp-drive

# Inspeccionar contenedor
docker inspect mcp-drive
```

## 🏗️ Arquitectura Técnica

### Transport Layer

- **StreamableHTTP**: Transport moderno stateless (HTTP-based)
- **Deprecado**: SSE (Server-Sent Events) - removido en v2.0.0
- **Ventajas**: Sin estado, escalable, compatible con proxies/load balancers

### MCP SDK

- **Version**: 1.19.1
- **API**: McpServer high-level (reemplaza Server low-level)
- **Validación**: Zod schemas automáticos en inputSchema/outputSchema
- **Registro**: `server.registerTool(name, config, handler)`

### Herramientas Modularizadas

```typescript
// src/mcp/tools/list-drives.ts
export const listDrivesTool = {
  name: "list_drives",
  config: { title, description, inputSchema, outputSchema },
  handler: async (params) => {
    /* ... */
  },
};

// src/mcp/server.ts (33 líneas)
const toolList = Object.values(tools);
toolList.forEach((tool) => {
  server.registerTool(tool.name, tool.config, tool.handler);
});
```

### Path Aliases

```typescript
// tsconfig.json
"baseUrl": ".",
"paths": {
  "@/*": ["src/*"]
}

// En código
import { logger } from "@/utils/logger.js";
import { googleDriveService } from "@/services/drive-service.js";
```

**Nota**: Los imports usan extensión `.js` aunque los archivos sean `.ts` (requisito de TypeScript ESM con `"module": "NodeNext"`)

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

### Servidor no inicia

```bash
# Verificar que el puerto no esté en uso
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Cambiar puerto si está ocupado
PORT=3001 pnpm dev
```

### Error: "Service account file not found"

- Verifica que el archivo JSON existe en la ruta especificada
- En Docker, asegúrate de montar el volumen correctamente:
  ```bash
  -v $(pwd)/keys:/app/keys:ro
  ```

### Error: "Unauthorized: Invalid API key"

- Verifica que `MCP_API_KEY` esté configurado en el servidor
- El API key debe enviarse en el header `X-API-Key` (no en `_meta.apiKey`)
- Formato correcto:
  ```typescript
  headers: { "X-API-Key": "tu-api-key" }
  ```

### No se pueden leer archivos

- Verifica que el Service Account tenga acceso (compartido con su email)
- Confirma que el scope sea `drive.readonly`
- Revisa permisos de la carpeta/archivo en Drive

### Cliente no puede conectar (VPS)

```bash
# Verificar que el puerto esté expuesto
docker ps | grep mcp-drive

# Verificar firewall
sudo ufw status
sudo ufw allow 3001/tcp

# Test de conectividad
curl http://vps-ip:3001/health
```

### Logs no aparecen

- Configura `LOG_LEVEL=debug` para ver más detalles
- Verifica permisos de escritura en la carpeta del proyecto
- En Docker: `docker-compose logs -f mcp-drive`

### Alto uso de memoria

- Ajusta límites en `docker-compose.yml`:
  ```yaml
  deploy:
    resources:
      limits:
        memory: 256M
  ```
