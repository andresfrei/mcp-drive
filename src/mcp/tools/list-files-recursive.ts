/**
 * Tool: list_files_recursive
 * Lista recursivamente todos los archivos y subcarpetas de una carpeta
 * Soporta filtros opcionales por fecha de modificación y tipo MIME
 */

import { z } from "zod";
import { googleDriveService } from "@/services/drive-service.js";

export const listFilesRecursiveTool = {
  name: "list_files_recursive",
  config: {
    title: "List Files Recursively in Google Drive",
    description:
      "List all files and subfolders recursively from a Google Drive folder with optional filters (date modified, MIME type). Perfect for daily scans of updated documents.",
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
      modifiedAfter: z
        .string()
        .optional()
        .describe(
          "Filter files modified after this date (RFC 3339 format: '2024-10-17T08:00:00' or '2024-10-17T08:00:00Z' for UTC)"
        ),
      mimeType: z
        .string()
        .optional()
        .describe(
          "Filter by MIME type (e.g., 'application/vnd.google-apps.document' for Google Docs, 'application/pdf' for PDFs)"
        ),
    },
    outputSchema: {
      totalItems: z.number(),
      filters: z
        .object({
          modifiedAfter: z.string().optional(),
          mimeType: z.string().optional(),
        })
        .optional(),
      items: z.array(
        z.object({
          id: z.string().describe("File ID"),
          name: z.string().describe("File name"),
          mimeType: z.string().describe("MIME type"),
          modifiedTime: z.string().describe("Last modification date (RFC 3339)"),
          size: z.string().optional().describe("File size in bytes"),
          webViewLink: z.string().optional().describe("Web view link"),
          parents: z.array(z.string()).optional().describe("Parent folder IDs"),
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
    modifiedAfter?: string;
    mimeType?: string;
  }) => {
    const items = await googleDriveService.listFilesRecursive(
      params.folderId,
      params.driveId,
      params.maxDepth,
      params.modifiedAfter,
      params.mimeType
    );

    const output = {
      totalItems: items.length,
      filters: {
        ...(params.modifiedAfter && { modifiedAfter: params.modifiedAfter }),
        ...(params.mimeType && { mimeType: params.mimeType }),
      },
      items,
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(output, null, 2) },
      ],
      structuredContent: output,
    };
  },
};
