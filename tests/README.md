# Tests

Colección de tests para el MCP Google Drive Server.

## Tests disponibles

### 🔌 test-mcp-client.ts
**Descripción:** Test general de conexión y herramientas básicas.

**Funcionalidad:**
- Conexión al servidor MCP vía StreamableHTTP
- Listado de herramientas disponibles
- Test de `list_drives`
- Test de `list_files` (primeros 5 archivos)

**Ejecución:**
```bash
pnpm test:client
```

---

### 📂 test-recursive.ts
**Descripción:** Test del listado recursivo de carpetas.

**Funcionalidad:**
- Listado completo de drives
- Selección automática de primera carpeta en root
- Listado recursivo hasta profundidad 5
- Estadísticas por nivel (depth)
- Análisis de carpetas vs archivos
- Formateo de tamaños de archivos

**Ejecución:**
```bash
pnpm test:recursive
```

**Salida esperada:**
- Total de items encontrados
- Distribución por profundidad
- Primeras 10 carpetas
- Primeros 10 archivos con tamaño

---

### 🚗 test-drive.ts
**Descripción:** Test de operaciones básicas de Google Drive API.

**Funcionalidad:**
- Pruebas directas con Google Drive API
- Listado de archivos
- Lectura de metadatos

**Ejecución:**
```bash
pnpm test:drive
```

---

## Prerrequisitos

1. **Servidor en ejecución:**
   ```bash
   pnpm dev
   ```

2. **Variables de entorno configuradas:**
   - `MCP_DRIVE_HOST` (default: localhost)
   - `MCP_DRIVE_PORT` (default: 3001)
   - `MCP_API_KEY` (API key para autenticación)

3. **Drive configurado:**
   - Al menos un drive en `drives-config.json`
   - Service Account con acceso al Drive

## Ejecución rápida

Ejecutar todos los tests:
```bash
pnpm test:all
```

Ejecutar test individual:
```bash
pnpm tsx tests/test-recursive.ts
```

## Estructura de un test

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import "dotenv/config";

const BASE_URL = `http://${process.env.MCP_DRIVE_HOST || "localhost"}:${process.env.MCP_DRIVE_PORT || 3001}`;
const API_KEY = process.env.MCP_API_KEY || "";

async function test() {
  const transport = new StreamableHTTPClientTransport(
    new URL(`${BASE_URL}/mcp?apiKey=${API_KEY}`)
  );
  
  const client = new Client({ name: "test", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  
  // ... pruebas ...
  
  await client.close();
}

test().catch(console.error);
```

## Debugging

Para ejecutar con debugger de VS Code:
1. Agregar breakpoint en el test
2. Ejecutar: `pnpm tsx --inspect-brk tests/test-recursive.ts`
3. Conectar debugger de VS Code

## Notas

- Los tests requieren conexión activa al servidor MCP
- Autenticación vía query parameter `?apiKey=...`
- Transport: StreamableHTTP (stateless, HTTP-based)
- Todos los tests usan el primer drive configurado por defecto
