/**
 * Tool: search_files
 * Busca archivos por nombre en Google Drive
 */

import { z } from "zod";
import { googleDriveService } from "@/services/drive-service.js";

export const searchFilesTool = {
  name: "search_files",
  config: {
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
  handler: async (params: { driveId: string; query: string }) => {
    const { driveId, query } = params;
    const files = await googleDriveService.searchFiles(driveId, query);
    const output = { totalFiles: files.length, files };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(output, null, 2) },
      ],
      structuredContent: output,
    };
  },
};
