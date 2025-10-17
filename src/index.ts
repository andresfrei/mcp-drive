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
import { validateApiKey } from "./mcp/auth.js";
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

    // Configurar CORS para cliente NestJS
    app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*"); // Ajustar en producción
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, X-API-Key, Authorization"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");

      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }
      next();
    });

    app.use(express.json());

    // Health check endpoint
    app.get("/health", (_req, res) => {
      res.json({ status: "healthy", timestamp: new Date().toISOString() });
    });

    // MCP server info endpoint (útil para debugging)
    app.get("/mcp/info", (_req, res) => {
      res.json({
        name: "google-drive-mcp",
        version: "1.0.0",
        transport: "sse",
        endpoints: {
          sse: "/sse",
          message: "/message",
          health: "/health",
          info: "/mcp/info",
        },
        capabilities: ["tools"],
        authenticated: !!process.env.MCP_API_KEY,
      });
    });

    // Endpoint SSE para MCP
    app.post("/sse", async (req, res) => {
      logger.info("New SSE connection attempt");

      // Extraer API key del header Authorization o X-API-Key
      const authHeader = req.headers.authorization?.replace("Bearer ", "");
      const apiKeyHeader = req.headers["x-api-key"] as string | undefined;
      const apiKey = authHeader || apiKeyHeader;

      // Validar API key antes de establecer conexión
      if (!validateApiKey(apiKey)) {
        logger.warn("Unauthorized SSE connection attempt");
        return res.status(401).json({ error: "Unauthorized: Invalid API key" });
      }

      logger.info("SSE connection established (authenticated)");

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
