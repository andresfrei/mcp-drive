/**
 * Cliente de prueba para MCP Server con StreamableHTTP (Modernizado)
 * Ejecutar con: pnpm tsx test-mcp-client.ts
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const API_KEY = "sk-1234567890abcdef1234567890abcdef";
const BASE_URL = "http://localhost:3001";

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

    // Probar herramienta list_files
    console.log("📤 Ejecutando: list_files (primeros 5 archivos)\n");
    const filesResult = await client.callTool({
      name: "list_files",
      arguments: { pageSize: 5 },
    });

    console.log("📥 Resultado list_files:");
    if (filesResult.content && filesResult.content.length > 0) {
      const parsed = JSON.parse(filesResult.content[0].text as string);
      console.log(`Total archivos: ${parsed.totalFiles}`);
      console.log("\nPrimeros archivos:");
      parsed.files.slice(0, 3).forEach((file: any, idx: number) => {
        console.log(`  ${idx + 1}. ${file.name} (${file.mimeType})`);
      });
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
