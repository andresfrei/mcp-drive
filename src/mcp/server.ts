/**
 * Configuración y creación del servidor MCP
 *
 * Inicializa el servidor MCP con sus capacidades y registra
 * los handlers para las operaciones de herramientas.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { mcpTools } from "./tools-definition.js";
import { executeToolHandler } from "./tools-handler.js";

/**
 * Crea y configura una instancia del servidor MCP
 *
 * Registra handlers para:
 * - Listado de herramientas disponibles
 * - Ejecución de herramientas (autenticación ya validada en /sse)
 *
 * @returns Servidor MCP configurado y listo para conectar
 */
export function createMCPServer(): Server {
  // Crear instancia del servidor
  const server = new Server(
    {
      name: "google-drive-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {}, // Habilita soporte para herramientas MCP
      },
    }
  );

  // ============================================================================
  // Handler: Listar herramientas disponibles
  // ============================================================================

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: mcpTools };
  });

  // ============================================================================
  // Handler: Ejecutar herramienta
  // ============================================================================

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // La validación ya se hizo en el endpoint /sse
    // Aquí solo ejecutamos la herramienta
    return executeToolHandler(name, args);
  });

  return server;
}
