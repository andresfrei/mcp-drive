/**
 * Definiciones de herramientas MCP para Google Drive
 *
 * Define los esquemas JSON Schema de todas las herramientas disponibles
 * en el servidor MCP, incluyendo parámetros, tipos y validaciones.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Catálogo completo de herramientas MCP disponibles
 * Cada herramienta incluye nombre, descripción y esquema de entrada
 */
export const mcpTools: Tool[] = [
  {
    name: "list_drives",
    description: "List all configured Google Drive accounts",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "add_drive",
    description: "Add a new Google Drive account to the configuration",
    inputSchema: {
      type: "object",
      properties: {
        driveId: {
          type: "string",
          description: "Unique ID for this drive (e.g., 'personal', 'work')",
        },
        name: {
          type: "string",
          description: "Display name for the drive",
        },
        description: {
          type: "string",
          description: "Optional description",
        },
        serviceAccountPath: {
          type: "string",
          description:
            "Path to Service Account JSON file (e.g., './credentials/personal-sa.json')",
        },
      },
      required: ["driveId", "name", "serviceAccountPath"],
    },
  },
  {
    name: "remove_drive",
    description: "Remove a Google Drive account from the configuration",
    inputSchema: {
      type: "object",
      properties: {
        driveId: {
          type: "string",
          description: "ID of the drive to remove",
        },
      },
      required: ["driveId"],
    },
  },
  {
    name: "list_files",
    description:
      "List files from Google Drive with optional filters (driveId, folderId, modifiedAfter/Before, mimeType)",
    inputSchema: {
      type: "object",
      properties: {
        driveId: { type: "string" },
        folderId: { type: "string" },
        modifiedAfter: { type: "string" },
        modifiedBefore: { type: "string" },
        mimeType: { type: "string" },
        pageSize: { type: "number" },
      },
    },
  },
  {
    name: "get_file_content",
    description: "Get content from a Google Drive file (Docs, Sheets, TXT, MD)",
    inputSchema: {
      type: "object",
      properties: {
        fileId: { type: "string" },
        driveId: { type: "string" },
      },
      required: ["fileId"],
    },
  },
  {
    name: "search_files",
    description: "Search files by name in a Google Drive",
    inputSchema: {
      type: "object",
      properties: {
        driveId: { type: "string" },
        query: { type: "string" },
      },
      required: ["driveId", "query"],
    },
  },
];
