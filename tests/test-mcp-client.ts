/**
 * Cliente de prueba para MCP Server con StreamableHTTP (Modernizado)
 * Ejecutar con: pnpm tsx test-mcp-client.ts
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE_URL = `http://${process.env.MCP_DRIVE_HOST || "localhost"}:${
  process.env.MCP_DRIVE_PORT || 3001
}`;
const API_KEY = process.env.MCP_API_KEY || "";

async function testMCPClient() {
  console.log("🔌 Conectando al MCP Server (StreamableHTTP)...\n");

  try {
    // Crear transporte StreamableHTTP con autenticación por query parameter
    const transport = new StreamableHTTPClientTransport(
      new URL(`${BASE_URL}/mcp?apiKey=${API_KEY}`)
    );

    // Crear cliente MCP
    const client = new Client(
      {
        name: "test-client",
        version: "2.0.0",
      },
      {
        capabilities: {},
      }
    );

    // Conectar al servidor
    await client.connect(transport);
    console.log("✅ Conectado al servidor MCP\n");

    // Listar herramientas disponibles
    console.log("📤 Solicitando lista de herramientas...\n");
    const toolsResponse = await client.listTools();

    console.log("🛠️  Herramientas disponibles:\n");
    toolsResponse.tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   📝 ${tool.description}`);
      console.log();
    });

    // Probar herramienta list_drives
    console.log("📤 Ejecutando: list_drives\n");
    const drivesResult = await client.callTool({
      name: "list_drives",
      arguments: {},
    });

    console.log("📥 Resultado list_drives:");
    if (drivesResult.content && drivesResult.content.length > 0) {
      console.log(drivesResult.content[0].text);
    }
    console.log();

    // Probar herramienta list_files (raíz)
    console.log("📤 Ejecutando: list_files (carpetas raíz)\n");
    const filesResult = await client.callTool({
      name: "list_files",
      arguments: { pageSize: 10 },
    });

    console.log("📥 Carpetas en raíz:");
    let comnetFolderId: string | undefined;
    if (filesResult.content && filesResult.content.length > 0) {
      const parsed = JSON.parse(filesResult.content[0].text as string);
      console.log(`Total archivos: ${parsed.totalFiles}\n`);
      parsed.files.forEach((file: any, idx: number) => {
        console.log(`  ${idx + 1}. ${file.name}`);
        console.log(`     📁 ID: ${file.id}`);
        console.log(`     📄 Tipo: ${file.mimeType}`);
        if (file.name === "COMNET") {
          comnetFolderId = file.id;
        }
      });
    }
    console.log();

    // Listar contenido de la carpeta COMNET
    if (comnetFolderId) {
      console.log("📤 Ejecutando: list_files (contenido carpeta COMNET)\n");
      const comnetResult = await client.callTool({
        name: "list_files",
        arguments: { 
          folderId: comnetFolderId,
          pageSize: 50 
        },
      });

      console.log("📥 Contenido de carpeta COMNET:");
      if (comnetResult.content && comnetResult.content.length > 0) {
        const parsed = JSON.parse(comnetResult.content[0].text as string);
        console.log(`Total elementos: ${parsed.totalFiles}\n`);
        parsed.files.forEach((file: any, idx: number) => {
          const isFolder = file.mimeType === "application/vnd.google-apps.folder";
          const icon = isFolder ? "📁" : "📄";
          console.log(`  ${icon} ${idx + 1}. ${file.name}`);
          console.log(`     ID: ${file.id}`);
          console.log(`     Tipo: ${file.mimeType}`);
          if (file.size) console.log(`     Tamaño: ${file.size} bytes`);
          console.log();
        });
      }
    } else {
      console.log("⚠️  No se encontró la carpeta COMNET");
    }
    console.log();

    // Cerrar conexión
    await client.close();
    console.log("✅ Test completado exitosamente");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.stack) {
      console.error("\n📍 Stack trace:");
      console.error(error.stack);
    }
  }
}

testMCPClient();
