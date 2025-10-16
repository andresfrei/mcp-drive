/**
 * Punto de entrada del servidor MCP para Google Drive
 *
 * Inicializa y ejecuta el servidor MCP con transporte HTTP/SSE,
 * permitiendo la gestión de múltiples cuentas de Google Drive
 * y operaciones de lectura de archivos.
 */

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import "dotenv/config";
import express from "express";
import { drivesConfigLoader } from "./config/config-loader.js";
import { createMCPServer } from "./mcp/server.js";
import { logger } from "./utils/logger.js";

// ============================================================================
// Configuración del servidor
// ============================================================================

const PORT = parseInt(process.env.MCP_DRIVE_PORT || "3000", 10);
const HOST = process.env.MCP_DRIVE_HOST || "0.0.0.0";

// ============================================================================
// Inicialización del servidor
// ============================================================================

/**
 * Función principal: inicia el servidor MCP sobre HTTP/SSE
 *
 * Proceso:
 * 1. Carga configuración de Drives
 * 2. Crea servidor MCP con handlers registrados
 * 3. Configura servidor HTTP con endpoint SSE
 * 4. Inicia servidor en puerto configurado
 */
async function main() {
  try {
    // Cargar configuración inicial (crea archivo vacío si no existe)
    drivesConfigLoader.load();

    logger.info("🚀 Google Drive MCP Server starting...");
    logger.info("📂 Ready to manage drives and access files");
    logger.info(
      "💡 Use 'add_drive' tool to configure your first Google Drive account"
    );

    // Crear aplicación Express
    const app = express();
    app.use(express.json());

    // Health check endpoint
    app.get("/health", (_req, res) => {
      res.json({ status: "healthy", timestamp: new Date().toISOString() });
    });

    // Endpoint SSE para MCP
    app.post("/sse", async (req, res) => {
      logger.info("New SSE connection established");

      // Crear servidor MCP para esta conexión
      const server = createMCPServer();

      // Configurar transporte SSE
      const transport = new SSEServerTransport("/message", res);
      await server.connect(transport);

      // Manejar cierre de conexión
      req.on("close", () => {
        logger.info("SSE connection closed");
      });
    });

    // Endpoint para mensajes del cliente
    app.post("/message", async (req, res) => {
      // Este endpoint es manejado por el transporte SSE
      res.status(200).end();
    });

    // Iniciar servidor HTTP
    app.listen(PORT, HOST, () => {
      logger.info(`✅ MCP Server running on http://${HOST}:${PORT}`);
      logger.info(`📡 SSE endpoint: POST http://${HOST}:${PORT}/sse`);
      logger.info(`🏥 Health check: GET http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

main();
