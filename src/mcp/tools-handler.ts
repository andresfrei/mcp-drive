/**
 * Manejador de ejecución de herramientas MCP
 *
 * Implementa la lógica de negocio para cada herramienta MCP,
 * delegando a los servicios correspondientes (config, drive).
 */

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { drivesConfigLoader } from "../config/config-loader.js";
import { GetFileContentParams, ListFilesParams } from "../config/types.js";
import { googleDriveService } from "../services/drive-service.js";
import { logger } from "../utils/logger.js";

/**
 * Ejecuta una herramienta MCP según su nombre
 *
 * @param name - Nombre de la herramienta a ejecutar
 * @param args - Argumentos de entrada para la herramienta
 * @returns Resultado formateado según protocolo MCP
 * @throws Error si la herramienta no existe o falla la ejecución
 */
export async function executeToolHandler(
  name: string,
  args: any
): Promise<CallToolResult> {
  try {
    switch (name) {
      // ======================================================================
      // Gestión de Drives
      // ======================================================================

      /**
       * Herramienta: list_drives
       * Lista todas las cuentas de Drive configuradas
       */
      case "list_drives": {
        const drives = drivesConfigLoader.listDrives();
        return {
          content: [
            {
              type: "text",
              text:
                drives.length === 0
                  ? "No drives configured yet. Use add_drive to add a Google Drive account."
                  : JSON.stringify(drives, null, 2),
            },
          ],
        };
      }

      /**
       * Herramienta: add_drive
       * Agrega una nueva cuenta de Drive a la configuración
       */
      case "add_drive": {
        const { driveId, name, description, serviceAccountPath } = args as {
          driveId: string;
          name: string;
          description?: string;
          serviceAccountPath: string;
        };

        const added = drivesConfigLoader.addDrive(driveId, {
          name,
          description,
          serviceAccountPath,
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ Drive added successfully:\n${JSON.stringify(
                added,
                null,
                2
              )}`,
            },
          ],
        };
      }

      /**
       * Herramienta: remove_drive
       * Elimina una cuenta de Drive de la configuración
       */
      case "remove_drive": {
        const { driveId } = args as { driveId: string };
        drivesConfigLoader.removeDrive(driveId);

        return {
          content: [
            {
              type: "text",
              text: `✅ Drive "${driveId}" removed successfully`,
            },
          ],
        };
      }

      // ======================================================================
      // Operaciones de archivos
      // ======================================================================

      /**
       * Herramienta: list_files
       * Lista archivos de Google Drive con filtros opcionales
       */
      case "list_files": {
        const params = (args || {}) as ListFilesParams;
        const files = await googleDriveService.listFiles(params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalFiles: files.length,
                  files,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      /**
       * Herramienta: get_file_content
       * Obtiene el contenido de un archivo específico
       */
      case "get_file_content": {
        const params = args as unknown as GetFileContentParams;
        if (!params?.fileId) {
          throw new Error("fileId is required");
        }
        const fileContent = await googleDriveService.getFileContent(
          params.fileId,
          params.driveId
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(fileContent, null, 2),
            },
          ],
        };
      }

      /**
       * Herramienta: search_files
       * Busca archivos por nombre en un Drive
       */
      case "search_files": {
        const { driveId, query } = args as unknown as {
          driveId: string;
          query: string;
        };
        const files = await googleDriveService.searchFiles(driveId, query);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  query,
                  totalResults: files.length,
                  files,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ======================================================================
      // Herramienta no encontrada
      // ======================================================================

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Error executing tool: ${name}`, { error });
    throw error;
  }
}
