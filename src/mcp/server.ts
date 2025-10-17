/**
 * Configuración y creación del servidor MCP (Modernizado)
 *
 * Inicializa el servidor MCP usando McpServer high-level API
 * con registro directo de herramientas y manejo automático de schemas.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { drivesConfigLoader } from "../config/config-loader.js";
import { googleDriveService } from "../services/drive-service.js";
import { logger } from "../utils/logger.js";

/**
 * Crea y configura una instancia del servidor MCP
 *
 * Registra todas las herramientas de Google Drive usando
 * el API de alto nivel con schemas Zod para validación.
 *
 * @returns Servidor MCP configurado y listo para conectar
 */
export function createMCPServer(): McpServer {
  const server = new McpServer({
    name: "google-drive-mcp",
    version: "2.0.0",
  });

  // ============================================================================
  // Gestión de Drives
  // ============================================================================

  server.registerTool(
    "list_drives",
    {
      title: "List Google Drive Accounts",
      description: "List all configured Google Drive accounts",
      inputSchema: {},
      outputSchema: {
        drives: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              description: z.string().optional(),
            })
          )
          .optional(),
      },
    },
    async () => {
      const drives = drivesConfigLoader.listDrives();
      const output = { drives };

      return {
        content: [
          {
            type: "text",
            text:
              drives.length === 0
                ? "No drives configured yet. Use add_drive to add a Google Drive account."
                : JSON.stringify(output, null, 2),
          },
        ],
        structuredContent: output,
      };
    }
  );

  server.registerTool(
    "add_drive",
    {
      title: "Add Google Drive Account",
      description: "Add a new Google Drive account to the configuration",
      inputSchema: {
        driveId: z
          .string()
          .describe("Unique ID for this drive (e.g., 'personal', 'work')"),
        name: z.string().describe("Display name for the drive"),
        description: z.string().optional().describe("Optional description"),
        serviceAccountPath: z
          .string()
          .describe(
            "Path to Service Account JSON file (e.g., './keys/personal-sa.json')"
          ),
      },
      outputSchema: {
        success: z.boolean(),
        drive: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
        }),
      },
    },
    async ({ driveId, name, description, serviceAccountPath }) => {
      const added = drivesConfigLoader.addDrive(driveId, {
        name,
        description,
        serviceAccountPath,
      });

      const output = {
        success: true,
        drive: { id: driveId, name, description },
      };

      return {
        content: [
          {
            type: "text",
            text: `✅ Drive added successfully:\n${JSON.stringify(added, null, 2)}`,
          },
        ],
        structuredContent: output,
      };
    }
  );

  server.registerTool(
    "remove_drive",
    {
      title: "Remove Google Drive Account",
      description: "Remove a Google Drive account from the configuration",
      inputSchema: {
        driveId: z.string().describe("ID of the drive to remove"),
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
      },
    },
    async ({ driveId }) => {
      drivesConfigLoader.removeDrive(driveId);
      const output = {
        success: true,
        message: `Drive "${driveId}" removed successfully`,
      };

      return {
        content: [{ type: "text", text: `✅ ${output.message}` }],
        structuredContent: output,
      };
    }
  );

  // ============================================================================
  // Operaciones de archivos
  // ============================================================================

  server.registerTool(
    "list_files",
    {
      title: "List Google Drive Files",
      description:
        "List files from Google Drive with optional filters (driveId, folderId, modifiedAfter/Before, mimeType)",
      inputSchema: {
        driveId: z.string().optional().describe("Drive ID to list files from"),
        folderId: z
          .string()
          .optional()
          .describe("Folder ID to list files from"),
        modifiedAfter: z
          .string()
          .optional()
          .describe("Filter files modified after this date (ISO 8601)"),
        modifiedBefore: z
          .string()
          .optional()
          .describe("Filter files modified before this date (ISO 8601)"),
        mimeType: z.string().optional().describe("Filter by MIME type"),
        pageSize: z
          .number()
          .optional()
          .default(100)
          .describe("Number of files to return (max 1000)"),
      },
      outputSchema: {
        totalFiles: z.number(),
        files: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            mimeType: z.string(),
            modifiedTime: z.string(),
            size: z.string().optional(),
            webViewLink: z.string().optional(),
            parents: z.array(z.string()).optional(),
          })
        ),
      },
    },
    async (params) => {
      const files = await googleDriveService.listFiles(params);
      const output = { totalFiles: files.length, files };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

  server.registerTool(
    "get_file_content",
    {
      title: "Get File Content",
      description:
        "Get content from a Google Drive file (Docs, Sheets, TXT, MD)",
      inputSchema: {
        fileId: z.string().describe("ID of the file to read"),
        driveId: z.string().optional().describe("Drive ID (if specified)"),
      },
      outputSchema: {
        fileId: z.string(),
        name: z.string(),
        mimeType: z.string(),
        content: z.string(),
      },
    },
    async ({ fileId, driveId }) => {
      if (!fileId) {
        throw new Error("fileId is required");
      }
      const fileContent = await googleDriveService.getFileContent(
        fileId,
        driveId
      );

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(fileContent, null, 2) },
        ],
        structuredContent: {
          fileId: fileContent.fileId,
          name: fileContent.fileName,
          mimeType: fileContent.mimeType,
          content: fileContent.content,
        },
      };
    }
  );

  server.registerTool(
    "search_files",
    {
      title: "Search Google Drive Files",
      description: "Search files by name in a Google Drive",
      inputSchema: {
        driveId: z.string().describe("Drive ID to search in"),
        query: z.string().describe("Search query (file name)"),
      },
      outputSchema: {
        totalFiles: z.number(),
        files: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            mimeType: z.string(),
            modifiedTime: z.string(),
            webViewLink: z.string().optional(),
          })
        ),
      },
    },
    async ({ driveId, query }) => {
      const files = await googleDriveService.searchFiles(driveId, query);
      const output = { totalFiles: files.length, files };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

  logger.info("MCP Server initialized with 6 tools");
  return server;
}
