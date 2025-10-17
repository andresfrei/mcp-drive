/**
 * Tool: list_files_recursive
 * Lista recursivamente todos los archivos y subcarpetas de una carpeta
 */

import { z } from "zod";
import { googleDriveService } from "@/services/drive-service.js";

export const listFilesRecursiveTool = {
  name: "list_files_recursive",
  config: {
    title: "List Files Recursively in Google Drive",
    description:
      "List all files and subfolders recursively from a Google Drive folder (includes nested content with depth and path info)",
    inputSchema: {
      folderId: z
        .string()
        .describe("Folder ID to start recursive listing from"),
      driveId: z
        .string()
        .optional()
        .describe("Drive ID (uses first drive if not specified)"),
      maxDepth: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum recursion depth (default: 10)"),
    },
    outputSchema: {
      totalItems: z.number(),
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          mimeType: z.string(),
          modifiedTime: z.string(),
          size: z.string().optional(),
          webViewLink: z.string().optional(),
          parents: z.array(z.string()).optional(),
          depth: z.number().describe("Nesting level (0 = root)"),
          path: z.string().describe("Full path from root folder"),
        })
      ),
    },
  },
  handler: async (params: {
    folderId: string;
    driveId?: string;
    maxDepth?: number;
  }) => {
    const items = await googleDriveService.listFilesRecursive(
      params.folderId,
      params.driveId,
      params.maxDepth
    );
    const output = { totalItems: items.length, items };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(output, null, 2) },
      ],
      structuredContent: output,
    };
  },
};
