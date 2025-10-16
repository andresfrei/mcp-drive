/**
 * Servicio de integración con Google Drive API
 *
 * Proporciona operaciones de lectura sobre archivos de Google Drive:
 * - Listar archivos con filtros avanzados
 * - Obtener contenido de archivos (Docs, Sheets, texto)
 * - Buscar archivos por nombre
 * - Gestión de múltiples clientes autenticados (uno por Drive)
 *
 * Soporta Google Workspace (Docs, Sheets, Slides) y archivos de texto plano
 */

import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";
import path from "path";
import { drivesConfigLoader } from "../config/config-loader.js";
import {
  DriveFile,
  FileContent,
  ListFilesParams,
  SUPPORTED_MIME_TYPES,
} from "../config/types.js";
import { logger } from "../utils/logger.js";

/**
 * Clase principal del servicio de Google Drive
 * Implementa patrón singleton via exportación de instancia única
 */
export class GoogleDriveService {
  /** Cache de clientes autenticados de Google Drive (uno por driveId) */
  private driveClients: Map<string, any> = new Map();

  /**
   * Obtiene o crea un cliente autenticado de Google Drive
   *
   * Implementa lazy loading: crea el cliente solo cuando se necesita
   * y lo cachea para reutilización
   *
   * @param driveId - Identificador del Drive
   * @returns Cliente de Google Drive autenticado
   */
  private async getDriveClient(driveId: string) {
    // Retornar cliente cacheado si existe
    if (this.driveClients.has(driveId)) {
      return this.driveClients.get(driveId);
    }

    // Crear nuevo cliente autenticado
    const driveConfig = drivesConfigLoader.getDriveConfig(driveId);

    // Autenticar usando Service Account con permisos de solo lectura
    // Soporta credenciales inline o archivo de service account
    const auth = driveConfig.credentials
      ? new GoogleAuth({
          credentials: driveConfig.credentials,
          scopes: ["https://www.googleapis.com/auth/drive.readonly"],
        })
      : new GoogleAuth({
          keyFile: path.resolve(driveConfig.serviceAccountPath!),
          scopes: ["https://www.googleapis.com/auth/drive.readonly"],
        });

    // Crear instancia del cliente de Drive API v3
    const drive = google.drive({ version: "v3", auth });
    this.driveClients.set(driveId, drive);

    logger.info(`Initialized Google Drive client for: ${driveId}`);
    return drive;
  }

  /**
   * Lista archivos de Google Drive con filtros opcionales
   *
   * Soporta filtrado por:
   * - Carpeta específica (folderId)
   * - Rango de fechas de modificación (modifiedAfter/Before)
   * - Tipo MIME específico
   * - Paginación (pageSize)
   *
   * @param params - Parámetros de filtrado y paginación
   * @returns Array de archivos con metadatos
   */
  async listFiles(params: ListFilesParams): Promise<DriveFile[]> {
    // Usar primer Drive si no se especifica uno
    const driveId =
      params.driveId || Object.keys(drivesConfigLoader.getConfig().drives)[0];
    const drive = await this.getDriveClient(driveId);

    // Construir query de filtrado de Google Drive
    const queryParts: string[] = ["trashed = false"]; // Excluir archivos en papelera

    if (params.folderId) {
      queryParts.push(`'${params.folderId}' in parents`);
    }

    if (params.modifiedAfter) {
      queryParts.push(`modifiedTime >= '${params.modifiedAfter}'`);
    }

    if (params.modifiedBefore) {
      queryParts.push(`modifiedTime <= '${params.modifiedBefore}'`);
    }

    if (params.mimeType) {
      queryParts.push(`mimeType = '${params.mimeType}'`);
    }

    const query = queryParts.join(" and ");

    try {
      // Ejecutar consulta a Google Drive API
      const response = await drive.files.list({
        q: query, // Query construido dinámicamente
        fields:
          "files(id, name, mimeType, modifiedTime, size, webViewLink, parents)", // Campos específicos
        pageSize: params.pageSize || 100, // Límite por defecto: 100 archivos
        orderBy: "modifiedTime desc", // Ordenar por más recientes primero
      });

      const files = response.data.files || [];

      logger.info(`Listed ${files.length} files from drive: ${driveId}`);

      // Mapear a tipo DriveFile tipado
      return files.map((file: Record<string, any>) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        modifiedTime: file.modifiedTime!,
        size: file.size,
        webViewLink: file.webViewLink,
        parents: file.parents,
      }));
    } catch (error) {
      logger.error("Error listing files", { driveId, error });
      throw error;
    }
  }

  /**
   * Obtiene el contenido de un archivo de Google Drive
   *
   * Soporta:
   * - Google Docs → exporta como texto plano
   * - Google Sheets → exporta como CSV
   * - Archivos de texto (.txt, .md) → descarga directa
   *
   * @param fileId - ID del archivo en Google Drive
   * @param driveId - ID del Drive (opcional, usa el primero si no se especifica)
   * @returns Contenido del archivo con metadatos
   * @throws Error si el tipo de archivo no es soportado
   */
  async getFileContent(fileId: string, driveId?: string): Promise<FileContent> {
    const targetDriveId =
      driveId || Object.keys(drivesConfigLoader.getConfig().drives)[0];
    const drive = await this.getDriveClient(targetDriveId);

    try {
      // Obtener metadatos del archivo
      const metadata = await drive.files.get({
        fileId,
        fields: "id, name, mimeType",
      });

      const file = metadata.data;
      const mimeType = file.mimeType!;
      let content = "";

      // Google Docs: exportar como texto plano
      if (mimeType === SUPPORTED_MIME_TYPES.GOOGLE_DOC) {
        const response = await drive.files.export({
          fileId,
          mimeType: SUPPORTED_MIME_TYPES.EXPORT_TEXT,
        });
        content = response.data as string;
      }
      // Google Sheets: exportar como CSV
      else if (mimeType === SUPPORTED_MIME_TYPES.GOOGLE_SHEET) {
        const response = await drive.files.export({
          fileId,
          mimeType: SUPPORTED_MIME_TYPES.EXPORT_CSV,
        });
        content = response.data as string;
      }
      // Archivos de texto plano: descarga directa
      else if (
        mimeType === SUPPORTED_MIME_TYPES.TEXT_PLAIN ||
        mimeType === SUPPORTED_MIME_TYPES.TEXT_MARKDOWN ||
        mimeType === "text/markdown" ||
        file.name?.endsWith(".txt") ||
        file.name?.endsWith(".md")
      ) {
        const response = await drive.files.get(
          { fileId, alt: "media" },
          { responseType: "text" }
        );
        content = response.data as string;
      }
      // Tipo de archivo no soportado
      else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      logger.info(`Retrieved content for file: ${file.name} (${mimeType})`);

      return {
        fileId: file.id!,
        fileName: file.name!,
        mimeType,
        content,
        extractedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error getting file content", {
        fileId,
        driveId: targetDriveId,
        error,
      });
      throw error;
    }
  }

  /**
   * Busca archivos por nombre en un Drive específico
   *
   * Utiliza el operador 'contains' de Google Drive para búsqueda parcial
   * Excluye automáticamente archivos en papelera
   *
   * @param driveId - ID del Drive donde buscar
   * @param query - Texto a buscar en el nombre del archivo
   * @returns Array de archivos que coinciden con la búsqueda
   */
  async searchFiles(driveId: string, query: string): Promise<DriveFile[]> {
    const drive = await this.getDriveClient(driveId);

    try {
      // Buscar por nombre (case-insensitive)
      const response = await drive.files.list({
        q: `name contains '${query}' and trashed = false`, // Búsqueda parcial
        fields: "files(id, name, mimeType, modifiedTime, size, webViewLink)", // Campos básicos
        pageSize: 50, // Límite de resultados
        orderBy: "modifiedTime desc", // Más recientes primero
      });

      const files = response.data.files || [];
      logger.info(`Search found ${files.length} files for query: "${query}"`);

      return files.map((file: Record<string, any>) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        modifiedTime: file.modifiedTime!,
        size: file.size,
        webViewLink: file.webViewLink,
      }));
    } catch (error) {
      logger.error("Error searching files", { driveId, query, error });
      throw error;
    }
  }
}

/** Instancia singleton del servicio de Google Drive */
export const googleDriveService = new GoogleDriveService();
