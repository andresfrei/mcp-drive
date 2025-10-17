/**
 * Tool: get_file_content
 * Obtiene el contenido de un archivo de Google Drive
 */

import { z } from "zod";
import { googleDriveService } from "@/services/drive-service.js";

export const getFileContentTool = {
  name: "get_file_content",
  config: {
    title: "Get File Content",
    description: "Get content from a Google Drive file (Docs, Sheets, TXT, MD)",
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
  handler: async (params: { fileId: string; driveId?: string }) => {
    const { fileId, driveId } = params;

    if (!fileId) {
      throw new Error("fileId is required");
    }

    const fileContent = await googleDriveService.getFileContent(
      fileId,
      driveId
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(fileContent, null, 2),
        },
      ],
      structuredContent: {
        fileId: fileContent.fileId,
        name: fileContent.fileName,
        mimeType: fileContent.mimeType,
        content: fileContent.content,
      },
    };
  },
};
