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
import { validateApiKey } from "./auth.js";
import { mcpTools } from "./tools-definition.js";
import { executeToolHandler } from "./tools-handler.js";

/**
 * Crea y configura una instancia del servidor MCP
 *
 * Registra handlers para:
 * - Listado de herramientas disponibles
 * - Ejecución de herramientas con autenticación
 *
 * @param apiKey - API key opcional extraído del header HTTP
 * @returns Servidor MCP configurado y listo para conectar
 */
export function createMCPServer(apiKey?: string): Server {
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

    // Validar autenticación usando el API key del contexto HTTP
    if (!validateApiKey(apiKey)) {
      throw new Error("Unauthorized: Invalid API key");
    }

    // Ejecutar herramienta y retornar resultado
    return executeToolHandler(name, args);
  });

  return server;
}
