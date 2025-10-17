/**
 * Tool: add_drive
 * Agrega una nueva cuenta de Google Drive a la configuración
 */

import { z } from "zod";
import { drivesConfigLoader } from "@/config/config-loader.js";

export const addDriveTool = {
  name: "add_drive",
  config: {
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
  handler: async (params: {
    driveId: string;
    name: string;
    description?: string;
    serviceAccountPath: string;
  }) => {
    const { driveId, name, description, serviceAccountPath } = params;
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
          type: "text" as const,
          text: `✅ Drive added successfully:\n${JSON.stringify(added, null, 2)}`,
        },
      ],
      structuredContent: output,
    };
  },
};
