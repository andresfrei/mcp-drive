/**
 * Punto de entrada del servidor MCP para Google Drive (Modernizado)
 *
 * Servidor MCP con transporte StreamableHTTP (stateless),
 * autenticación por middleware, y soporte para múltiples cuentas
 * de Google Drive.
 */

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
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
 * Función principal: inicia el servidor MCP sobre HTTP/StreamableHTTP
 *
 * Proceso:
 * 1. Carga configuración de drives desde drives-config.json
 * 2. Crea servidor Express con CORS
 * 3. Middleware de autenticación por API key
 * 4. Endpoint /mcp con StreamableHTTP (stateless)
 * 5. Healthcheck endpoints
 */
async function main() {
  try {
    // Cargar configuración de drives
    const config = drivesConfigLoader.load();
    const driveCount = Object.keys(config.drives).length;

    logger.info(`Loaded ${driveCount} drive(s) from configuration`);

    if (driveCount === 0) {
      logger.warn("No drives configured yet!");
      logger.info(
        "💡 Use 'add_drive' tool to configure your first Google Drive account"
      );
    }

    // Crear aplicación Express
    const app = express();
    app.use(express.json());

    // ============================================================================
    // CORS Configuration
    // ============================================================================

    app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*"); // Ajustar en producción
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Mcp-Session-Id"
      );
      res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }
      next();
    });

    // ============================================================================
    // Authentication Middleware
    // ============================================================================

    app.use("/mcp", (req, res, next) => {
      // Soportar autenticación por header Authorization o query parameter apiKey
      const authHeader = req.headers.authorization?.replace("Bearer ", "");
      const queryKey = req.query.apiKey as string | undefined;
      const apiKey = authHeader || queryKey;

      if (!validateApiKey(apiKey)) {
        logger.warn("Unauthorized MCP request", {
          ip: req.ip,
          path: req.path,
        });
        return res.status(401).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Unauthorized: Invalid or missing API key",
          },
          id: null,
        });
      }

      next();
    });

    // ============================================================================
    // Health Check Endpoints
    // ============================================================================

    app.get("/health", (_req, res) => {
      res.json({ status: "healthy", timestamp: new Date().toISOString() });
    });

    app.get("/info", (_req, res) => {
      res.json({
        name: "google-drive-mcp",
        version: "2.0.0",
        transport: "streamable-http",
        endpoints: {
          mcp: "/mcp",
          health: "/health",
          info: "/info",
        },
        capabilities: ["tools"],
        authenticated: !!process.env.MCP_API_KEY,
        drivesConfigured: driveCount,
      });
    });

    // ============================================================================
    // MCP Endpoint - StreamableHTTP (Stateless)
    // ============================================================================

    app.post("/mcp", async (req, res) => {
      try {
        // Crear nuevo transporte para cada request (stateless mode)
        // Evita colisiones de request IDs entre diferentes clientes
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // Stateless
          enableJsonResponse: true, // Soporte JSON directo
        });

        // Cleanup al cerrar conexión
        res.on("close", () => {
          transport.close();
        });

        // Crear servidor MCP y conectar transporte
        const server = createMCPServer();
        await server.connect(transport);

        // Procesar request
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        logger.error("Error handling MCP request", { error });

        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          });
        }
      }
    });

    // ============================================================================
    // Iniciar servidor HTTP
    // ============================================================================

    const server = app.listen(PORT, HOST, () => {
      logger.info(`✅ MCP Server running on http://${HOST}:${PORT}`);
      logger.info(`📡 MCP endpoint: POST http://${HOST}:${PORT}/mcp`);
      logger.info(`🏥 Health check: GET http://${HOST}:${PORT}/health`);
      logger.info(`ℹ️  Server info: GET http://${HOST}:${PORT}/info`);
    });

    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error("Server error", { error });
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

main();
