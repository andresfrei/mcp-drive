/**
 * Test de la herramienta list_files_recursive
 *
 * Prueba el listado recursivo de archivos y carpetas en Google Drive
 */

import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import "dotenv/config";

const BASE_URL = `http://${process.env.MCP_DRIVE_HOST || "localhost"}:${
  process.env.MCP_DRIVE_PORT || 3001
}`;
const API_KEY = process.env.MCP_API_KEY || "";

async function testRecursiveListing() {
  console.log("🔌 Conectando al MCP Server (StreamableHTTP)...\n");

  // Crear cliente con autenticación por query param
  const transport = new StreamableHTTPClientTransport(
    new URL(`${BASE_URL}/mcp?apiKey=${API_KEY}`)
  );

  const client = new Client(
    {
      name: "test-recursive-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✅ Conectado al servidor MCP\n");

  // 1. Listar drives disponibles
  console.log("📤 Paso 1: Listando drives disponibles...");
  const drivesResult = await client.callTool({
    name: "list_drives",
    arguments: {},
  });

  const drivesData = JSON.parse(drivesResult.content[0].text);
  console.log(`📥 Drives encontrados: ${drivesData.drives.length}\n`);

  if (drivesData.drives.length === 0) {
    console.log("❌ No hay drives configurados. Saliendo...");
    await client.close();
    return;
  }

  const driveId = drivesData.drives[0].id;
  console.log(`🔑 Usando drive: ${driveId}\n`);

  // 2. Listar archivos del root para encontrar una carpeta
  console.log("📤 Paso 2: Listando archivos en root...");
  const rootFilesResult = await client.callTool({
    name: "list_files",
    arguments: {
      driveId,
      pageSize: 10,
    },
  });

  const rootData = JSON.parse(rootFilesResult.content[0].text);
  console.log(`📥 Total archivos en root: ${rootData.totalFiles}\n`);

  // Buscar una carpeta
  const folder = rootData.files.find(
    (f: any) => f.mimeType === "application/vnd.google-apps.folder"
  );

  if (!folder) {
    console.log("❌ No se encontró ninguna carpeta en root. Saliendo...");
    await client.close();
    return;
  }

  console.log(`📁 Carpeta seleccionada: "${folder.name}" (${folder.id})\n`);

  // 3. Listar recursivamente el contenido de la carpeta
  console.log("📤 Paso 3: Listando recursivamente la carpeta...");
  console.log(`   Carpeta: ${folder.name}`);
  console.log(`   Max depth: 5\n`);

  const recursiveResult = await client.callTool({
    name: "list_files_recursive",
    arguments: {
      folderId: folder.id,
      driveId,
      maxDepth: 5,
    },
  });

  const recursiveData = JSON.parse(recursiveResult.content[0].text);
  console.log(`📥 Resultado del listado recursivo:`);
  console.log(`   Total items encontrados: ${recursiveData.totalItems}\n`);

  // Analizar resultados por profundidad
  const byDepth: { [key: number]: number } = {};
  const folders: any[] = [];
  const files: any[] = [];

  recursiveData.items.forEach((item: any) => {
    byDepth[item.depth] = (byDepth[item.depth] || 0) + 1;
    if (item.mimeType === "application/vnd.google-apps.folder") {
      folders.push(item);
    } else {
      files.push(item);
    }
  });

  console.log("📊 Estadísticas:");
  console.log(`   Carpetas: ${folders.length}`);
  console.log(`   Archivos: ${files.length}`);
  console.log(`   Por profundidad:`);
  Object.keys(byDepth)
    .sort()
    .forEach((depth) => {
      console.log(`     Nivel ${depth}: ${byDepth[parseInt(depth)]} items`);
    });

  console.log("\n📂 Primeras 10 carpetas encontradas:");
  folders.slice(0, 10).forEach((f, i) => {
    console.log(`   ${i + 1}. [Depth ${f.depth}] ${f.path}`);
  });

  console.log("\n📄 Primeros 10 archivos encontrados:");
  files.slice(0, 10).forEach((f, i) => {
    const size = f.size ? `(${formatBytes(parseInt(f.size))})` : "";
    console.log(`   ${i + 1}. [Depth ${f.depth}] ${f.path} ${size}`);
  });

  console.log("\n✅ Test completado exitosamente");
  await client.close();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Ejecutar test
testRecursiveListing().catch((error) => {
  console.error("\n❌ Error en el test:");
  console.error(error);
  process.exit(1);
});
