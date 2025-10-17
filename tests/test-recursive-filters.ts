/**
 * Test de list_files_recursive con filtros opcionales
 *
 * Prueba los nuevos filtros:
 * - modifiedAfter: filtrar por fecha de modificación
 * - mimeType: filtrar por tipo de archivo
 */

import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import "dotenv/config";

const BASE_URL = `http://${process.env.MCP_DRIVE_HOST || "localhost"}:${
  process.env.MCP_DRIVE_PORT || 3001
}`;
const API_KEY = process.env.MCP_API_KEY || "";

async function testRecursiveWithFilters() {
  console.log("🧪 Test: list_files_recursive con filtros opcionales\n");
  console.log("🔌 Conectando al MCP Server...\n");

  const transport = new StreamableHTTPClientTransport(
    new URL(`${BASE_URL}/mcp?apiKey=${API_KEY}`)
  );

  const client = new Client(
    {
      name: "test-recursive-filters-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✅ Conectado\n");

  // Listar drives
  console.log("📤 Listando drives disponibles...");
  const drivesResult = await client.callTool({
    name: "list_drives",
    arguments: {},
  });

  const drivesData = JSON.parse((drivesResult as any).content[0].text);
  console.log(`📥 Drives: ${drivesData.drives.length}\n`);

  if (drivesData.drives.length === 0) {
    console.log("❌ No hay drives configurados");
    await client.close();
    return;
  }

  const firstDrive = drivesData.drives[0];
  console.log(`🎯 Usando drive: ${firstDrive.id}`);
  console.log(`   Nombre: ${firstDrive.name}\n`);

  // El usuario debe proporcionar un folderId para probar
  const TEST_FOLDER_ID = process.env.TEST_FOLDER_ID;
  
  if (!TEST_FOLDER_ID) {
    console.log("❌ Error: Debes configurar TEST_FOLDER_ID en el archivo .env");
    console.log("   Ejemplo: TEST_FOLDER_ID=1ABC...XYZ");
    console.log("\n💡 Tip: Obtén el ID desde la URL de Drive:");
    console.log("   https://drive.google.com/drive/folders/[ESTE_ES_EL_ID]\n");
    await client.close();
    return;
  }

  console.log(`📁 Folder a escanear: ${TEST_FOLDER_ID}\n`);

  // TEST 1: Sin filtros (baseline)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 TEST 1: Listado sin filtros (baseline)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const baselineResult = await client.callTool({
    name: "list_files_recursive",
    arguments: {
      folderId: TEST_FOLDER_ID,
      driveId: firstDrive.id,
      maxDepth: 3,
    },
  });

  const baselineData = JSON.parse((baselineResult as any).content[0].text);
  console.log(`✅ Total items sin filtros: ${baselineData.totalItems}`);
  
  if (baselineData.items.length > 0) {
    console.log("\n📊 Muestra (primeros 3 archivos):");
    baselineData.items.slice(0, 3).forEach((item: any, index: number) => {
      console.log(`\n   ${index + 1}. ${item.name}`);
      console.log(`      📁 Path: ${item.path}`);
      console.log(`      🆔 ID: ${item.id}`);
      console.log(`      📝 Type: ${item.mimeType}`);
      console.log(`      📅 Modified: ${item.modifiedTime}`);
      console.log(`      📊 Depth: ${item.depth}`);
    });
  }

  // TEST 2: Filtro por fecha (últimas 24 horas)
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 TEST 2: Filtro por fecha (últimas 24h)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString();

  console.log(`📅 Fecha filtro: ${yesterdayISO}\n`);

  const dateFilterResult = await client.callTool({
    name: "list_files_recursive",
    arguments: {
      folderId: TEST_FOLDER_ID,
      driveId: firstDrive.id,
      maxDepth: 3,
      modifiedAfter: yesterdayISO,
    },
  });

  const dateFilterData = JSON.parse((dateFilterResult as any).content[0].text);
  console.log(`✅ Items modificados últimas 24h: ${dateFilterData.totalItems}`);
  console.log(`📉 Reducción: ${baselineData.totalItems - dateFilterData.totalItems} items filtrados`);

  if (dateFilterData.items.length > 0) {
    console.log("\n📊 Archivos modificados recientemente:");
    dateFilterData.items.slice(0, 5).forEach((item: any, index: number) => {
      console.log(`\n   ${index + 1}. ${item.name}`);
      console.log(`      📁 Path: ${item.path}`);
      console.log(`      📅 Modified: ${item.modifiedTime}`);
    });
  } else {
    console.log("\n⚠️  No hay archivos modificados en las últimas 24h");
  }

  // TEST 3: Filtro por tipo (Google Docs)
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 TEST 3: Filtro por tipo (Google Docs)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const mimeType = "application/vnd.google-apps.document";
  console.log(`📝 MIME Type: ${mimeType}\n`);

  const typeFilterResult = await client.callTool({
    name: "list_files_recursive",
    arguments: {
      folderId: TEST_FOLDER_ID,
      driveId: firstDrive.id,
      maxDepth: 3,
      mimeType: mimeType,
    },
  });

  const typeFilterData = JSON.parse((typeFilterResult as any).content[0].text);
  console.log(`✅ Google Docs encontrados: ${typeFilterData.totalItems}`);
  console.log(`📉 Reducción: ${baselineData.totalItems - typeFilterData.totalItems} items filtrados`);

  if (typeFilterData.items.length > 0) {
    console.log("\n📊 Google Docs encontrados:");
    typeFilterData.items.slice(0, 5).forEach((item: any, index: number) => {
      console.log(`\n   ${index + 1}. ${item.name}`);
      console.log(`      📁 Path: ${item.path}`);
      console.log(`      📅 Modified: ${item.modifiedTime}`);
    });
  } else {
    console.log("\n⚠️  No hay Google Docs en esta carpeta");
  }

  // TEST 4: Combinación (fecha + tipo)
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 TEST 4: Filtros combinados (fecha + tipo)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Últimos 7 días
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekISO = lastWeek.toISOString();

  console.log(`📅 Fecha: ${lastWeekISO}`);
  console.log(`📝 Tipo: ${mimeType}\n`);

  const combinedResult = await client.callTool({
    name: "list_files_recursive",
    arguments: {
      folderId: TEST_FOLDER_ID,
      driveId: firstDrive.id,
      maxDepth: 3,
      modifiedAfter: lastWeekISO,
      mimeType: mimeType,
    },
  });

  const combinedData = JSON.parse((combinedResult as any).content[0].text);
  console.log(`✅ Google Docs modificados última semana: ${combinedData.totalItems}`);
  console.log(`📉 Reducción total: ${baselineData.totalItems - combinedData.totalItems} items filtrados`);

  if (combinedData.items.length > 0) {
    console.log("\n📊 Resultados:");
    combinedData.items.forEach((item: any, index: number) => {
      console.log(`\n   ${index + 1}. ${item.name}`);
      console.log(`      📁 Path: ${item.path}`);
      console.log(`      📅 Modified: ${item.modifiedTime}`);
      console.log(`      🆔 ID: ${item.id}`);
    });
  } else {
    console.log("\n⚠️  No hay Google Docs modificados en la última semana");
  }

  // Resumen final
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 RESUMEN DE TESTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(`✅ Sin filtros:           ${baselineData.totalItems} items`);
  console.log(`✅ Fecha (24h):           ${dateFilterData.totalItems} items`);
  console.log(`✅ Tipo (Docs):           ${typeFilterData.totalItems} items`);
  console.log(`✅ Combinado (7d + Docs): ${combinedData.totalItems} items`);

  console.log("\n✨ Tests completados exitosamente\n");

  await client.close();
}

// Ejecutar test
testRecursiveWithFilters().catch((error) => {
  console.error("\n❌ Error en el test:", error);
  process.exit(1);
});
