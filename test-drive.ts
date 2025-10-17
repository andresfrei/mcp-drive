/**
 * Script de prueba para verificar conexión con Google Drive
 * Ejecutar con: tsx test-drive.ts
 */

import { drivesConfigLoader } from "./src/config/config-loader.js";
import { googleDriveService } from "./src/services/drive-service.js";

async function testDrive() {
  console.log("🔧 Cargando configuración...");
  const config = drivesConfigLoader.load();

  const driveIds = Object.keys(config.drives);
  console.log(`✅ Drives configurados: ${driveIds.join(", ")}\n`);

  for (const driveId of driveIds) {
    console.log(`📂 Probando drive: ${driveId}`);
    const driveConfig = config.drives[driveId];
    console.log(`   Nombre: ${driveConfig.name || driveId}`);
    console.log(`   Descripción: ${driveConfig.description || "N/A"}`);

    try {
      // Listar primeros 10 archivos
      console.log(`\n📋 Listando archivos...`);
      const files = await googleDriveService.listFiles({
        driveId,
        pageSize: 10,
      });

      console.log(`✅ Se encontraron ${files.length} archivos:\n`);

      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   ID: ${file.id}`);
        console.log(`   Tipo: ${file.mimeType}`);
        console.log(
          `   Modificado: ${new Date(file.modifiedTime).toLocaleString()}`
        );
        if (file.webViewLink) {
          console.log(`   URL: ${file.webViewLink}`);
        }
        console.log();
      });

      if (files.length === 0) {
        console.log("⚠️  No se encontraron archivos. Verifica:");
        console.log("   1. El Service Account tiene acceso al Shared Drive");
        console.log("   2. El driveId es correcto (si está configurado)");
        console.log("   3. El rootFolderId es correcto (si está configurado)");
      }
    } catch (error: any) {
      console.error(`❌ Error al acceder al drive:`, error.message);
      console.error(`\n💡 Posibles causas:`);
      console.error(`   1. Service Account sin permisos en el Shared Drive`);
      console.error(`   2. DriveId incorrecto`);
      console.error(`   3. API de Google Drive no habilitada`);
      console.error(`   4. Credenciales inválidas\n`);
    }

    console.log("═".repeat(80) + "\n");
  }
}

testDrive().catch(console.error);
