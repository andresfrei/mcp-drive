/**
 * Configuración y creación del servidor MCP (Modernizado + Modular)
 *
 * Inicializa el servidor MCP usando McpServer high-level API
 * con registro automático de herramientas desde módulos independientes.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "@/utils/logger.js";
import * as tools from "@/mcp/tools/index.js";

/**
 * Crea y configura una instancia del servidor MCP
 *
 * Registra todas las herramientas de Google Drive de forma automática
 * desde la carpeta tools/, permitiendo escalabilidad y mantenibilidad.
 *
 * @returns Servidor MCP configurado y listo para conectar
 */
export function createMCPServer(): McpServer {
  const server = new McpServer({
    name: "google-drive-mcp",
    version: "2.0.0",
  });

  // Registro automático de todas las tools
  const toolList = Object.values(tools);
  toolList.forEach((tool) => {
    server.registerTool(tool.name, tool.config as any, tool.handler as any);
  });

  logger.info(`MCP Server initialized with ${toolList.length} tools`);
  return server;
}
