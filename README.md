# Google Drive MCP Server

Servidor MCP (Model Context Protocol) para gestión de múltiples cuentas de Google Drive con acceso de solo lectura.

## 🎯 Características

- ✅ **Servidor HTTP/SSE**: Expone API REST con Server-Sent Events para conexiones MCP
- ✅ **Multi-cliente**: Múltiples clientes pueden conectarse simultáneamente
- ✅ **Puerto configurable**: Ideal para VPS con múltiples servicios MCP
- ✅ **Multi-cuenta**: Gestiona múltiples cuentas de Google Drive simultáneamente
- ✅ **Autenticación segura**: Service Account con permisos de solo lectura
- ✅ **Operaciones de archivos**: Listar, buscar y obtener contenido
- ✅ **Soporta Google Workspace**: Docs, Sheets, Slides
- ✅ **Archivos de texto**: TXT, Markdown
- ✅ **Logging estructurado**: Winston con múltiples niveles
- ✅ **Validación robusta**: Zod schemas para configuración
- ✅ **API key opcional**: Autenticación de requests MCP
- ✅ **Docker-ready**: Configuración lista para deployment en VPS

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

## 🚀 Instalación y Deployment

### Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/andresfrei/mcp-drive.git
cd mcp-drive

# Instalar dependencias
pnpm install

# Configurar environment
cp .env.example .env
nano .env

# Desarrollo (con hot reload)
pnpm dev

# El servidor estará disponible en http://localhost:3000
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
PORT=3000                    # Puerto del servidor (default: 3000)
HOST=0.0.0.0                # Host de escucha (0.0.0.0 para Docker)

# Configuración de Drives
DRIVES_CONFIG_PATH=./drives-config.json

# Nivel de logging (debug, info, warn, error)
LOG_LEVEL=info

# API key para autenticación de requests MCP (opcional)
MCP_API_KEY=tu_api_key_seguro

# Para docker-compose: puerto externo
MCP_DRIVE_PORT=3000
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

## 🌐 Endpoints HTTP

El servidor expone los siguientes endpoints:

### Health Check

```bash
GET http://localhost:3000/health

# Respuesta
{
  "status": "healthy",
  "timestamp": "2024-10-16T10:30:00.000Z"
}
```

### MCP Server Info (Debugging)

```bash
GET http://localhost:3000/mcp/info

# Respuesta
{
  "name": "google-drive-mcp",
  "version": "1.0.0",
  "transport": "sse",
  "endpoints": {
    "sse": "/sse",
    "message": "/message",
    "health": "/health",
    "info": "/mcp/info"
  },
  "capabilities": ["tools"],
  "authenticated": true
}
```

### Conexión MCP (SSE)

```bash
POST http://localhost:3000/sse
Content-Type: application/json
X-API-Key: tu-api-key-aqui  # Opcional, si MCP_API_KEY está configurado

# Establece conexión Server-Sent Events para comunicación MCP
```

### Mensajes MCP

```bash
POST http://localhost:3000/message
Content-Type: application/json

# Endpoint usado internamente por el transporte SSE
```

## 🔌 Conectar desde Cliente

### Opción 1: Cliente NestJS (Orquestador)

**Recomendado para aplicaciones que necesitan múltiples MCPs:**

```typescript
// src/mcp/mcp.config.ts (NestJS)
import { registerAs } from "@nestjs/config";

export default registerAs("mcp", () => ({
  servers: {
    googleDrive: {
      name: "google-drive-local",
      transport: {
        type: "sse",
        // Desarrollo: http://localhost:3001/sse
        // Producción Docker: http://mcp-drive:3001/sse
        url: process.env.MCP_DRIVE_URL || "http://localhost:3001/sse",
      },
      apiKey: process.env.MCP_DRIVE_API_KEY, // Header X-API-Key
      timeout: 30000,
    },
  },
}));

// src/mcp/mcp.service.ts
const transport = new SSEClientTransport(new URL(config.transport.url), {
  headers: config.apiKey ? { "X-API-Key": config.apiKey } : undefined,
});

await client.connect(transport);
```

📚 **Ver guía completa**: [`docs/NESTJS-CLIENT.md`](./docs/NESTJS-CLIENT.md)

### Opción 2: Cliente Genérico

**Para aplicaciones simples o testing:**

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// Conectar al servidor MCP
const transport = new SSEClientTransport(new URL("http://tu-vps:3001/sse"), {
  headers: {
    "X-API-Key": "tu-api-key-aqui", // Opcional
  },
});

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

// Listar herramientas disponibles
const tools = await client.listTools();

// Ejecutar herramienta
const result = await client.callTool({
  name: "list_drives",
  arguments: {},
});

console.log(result);
```

### Características del Cliente

- ✅ **CORS habilitado**: Funciona desde cualquier dominio
- ✅ **API Key via headers**: Envía `X-API-Key` en el header HTTP
- ✅ **Conexiones persistentes**: SSE mantiene conexión abierta
- ✅ **Multi-cliente**: Múltiples clientes pueden conectarse simultáneamente

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
const transport = new SSEClientTransport(new URL("http://localhost:3001/sse"), {
  headers: {
    "X-API-Key": "tu_api_key_super_secreto_aqui",
  },
});
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

## 🧪 Desarrollo

```bash
# Desarrollo local con hot reload
pnpm dev
# Servidor en http://localhost:3000

# Build para producción
pnpm build

# Ejecutar versión compilada
pnpm start

# Ver logs de Docker
docker-compose logs -f

# Reiniciar contenedor
docker-compose restart

# Reconstruir imagen
docker-compose up -d --build
```

## 📊 Monitoreo

```bash
# Health check
curl http://localhost:3000/health

# Logs en tiempo real
docker-compose logs -f mcp-drive

# Stats de recursos
docker stats mcp-drive

# Inspeccionar contenedor
docker inspect mcp-drive
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
