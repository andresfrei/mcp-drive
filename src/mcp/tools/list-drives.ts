/**
 * Tool: list_drives
 * Lista todas las cuentas de Google Drive configuradas
 */

import { z } from "zod";
import { drivesConfigLoader } from "@/config/config-loader.js";

export const listDrivesTool = {
  name: "list_drives",
  config: {
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
  handler: async () => {
    const drives = drivesConfigLoader.listDrives();
    const output = { drives };

    return {
      content: [
        {
          type: "text" as const,
          text:
            drives.length === 0
              ? "No drives configured yet. Use add_drive to add a Google Drive account."
              : JSON.stringify(output, null, 2),
        },
      ],
      structuredContent: output,
    };
  },
};
