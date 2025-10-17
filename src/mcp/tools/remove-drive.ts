/**
 * Tool: remove_drive
 * Elimina una cuenta de Google Drive de la configuración
 */

import { z } from "zod";
import { drivesConfigLoader } from "@/config/config-loader.js";

export const removeDriveTool = {
  name: "remove_drive",
  config: {
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
  handler: async (params: { driveId: string }) => {
    const { driveId } = params;
    drivesConfigLoader.removeDrive(driveId);
    const output = {
      success: true,
      message: `Drive "${driveId}" removed successfully`,
    };

    return {
      content: [{ type: "text" as const, text: `✅ ${output.message}` }],
      structuredContent: output,
    };
  },
};
