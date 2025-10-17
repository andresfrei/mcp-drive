/**
 * Tool: list_files
 * Lista archivos de Google Drive con filtros opcionales
 */

import { z } from "zod";
import { googleDriveService } from "@/services/drive-service.js";

export const listFilesTool = {
  name: "list_files",
  config: {
    title: "List Google Drive Files",
    description:
      "List files from Google Drive with optional filters (driveId, folderId, modifiedAfter/Before, mimeType)",
    inputSchema: {
      driveId: z.string().optional().describe("Drive ID to list files from"),
      folderId: z.string().optional().describe("Folder ID to list files from"),
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
  handler: async (params: {
    driveId?: string;
    folderId?: string;
    modifiedAfter?: string;
    modifiedBefore?: string;
    mimeType?: string;
    pageSize?: number;
  }) => {
    const files = await googleDriveService.listFiles(params);
    const output = { totalFiles: files.length, files };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(output, null, 2) },
      ],
      structuredContent: output,
    };
  },
};
