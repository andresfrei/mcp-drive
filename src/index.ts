/**
 * Punto de entrada del servidor MCP para Google Drive
 *
 * Inicializa y ejecuta el servidor MCP con transporte stdio,
 * permitiendo la gestión de múltiples cuentas de Google Drive
 * y operaciones de lectura de archivos.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import { drivesConfigLoader } from "./config/config-loader.js";
import { createMCPServer } from "./mcp/server.js";
import { logger } from "./utils/logger.js";

// ============================================================================
// Inicialización del servidor
// ============================================================================

/**
 * Función principal: inicia el servidor MCP
 *
 * Proceso:
 * 1. Carga configuración de Drives
 * 2. Crea servidor MCP con handlers registrados
 * 3. Configura transporte stdio para comunicación
 * 4. Conecta el servidor y queda en escucha
 */
async function main() {
  try {
    // Cargar configuración inicial (crea archivo vacío si no existe)
    drivesConfigLoader.load();

    logger.info("🚀 Google Drive MCP Server started");
    logger.info("📂 Ready to manage drives and access files");
    logger.info(
      "💡 Use 'add_drive' tool to configure your first Google Drive account"
    );

    // Crear servidor MCP con handlers configurados
    const server = createMCPServer();

    // Configurar transporte de comunicación (stdin/stdout)
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info("✅ MCP Server running");
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

main();
