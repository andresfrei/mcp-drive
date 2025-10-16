import { z } from "zod";

/**
 * Esquemas de configuración y tipos para Google Drive MCP Server
 *
 * Define la estructura de datos para la gestión de múltiples cuentas de Drive,
 * archivos, contenido y parámetros de herramientas MCP.
 */

// ============================================================================
// Esquemas de configuración Zod
// ============================================================================

/**
 * Esquema Zod para la configuración individual de un Drive
 * Valida: nombre, descripción opcional y ruta de la cuenta de servicio
 */
export const DriveConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  serviceAccountPath: z.string(),
});

/**
 * Esquema Zod para la configuración completa de todos los Drives
 * Estructura: diccionario de ID de Drive → configuración individual
 */
export const DrivesConfigSchema = z.object({
  drives: z.record(z.string(), DriveConfigSchema),
});

/** Tipo inferido: configuración de un Drive individual */
export type DriveConfig = z.infer<typeof DriveConfigSchema>;

/** Tipo inferido: configuración completa de todos los Drives */
export type DrivesConfig = z.infer<typeof DrivesConfigSchema>;

// ============================================================================
// Tipos de Google Drive API
// ============================================================================

/**
 * Representa un archivo de Google Drive con sus metadatos principales
 * Incluye información de identificación, tipo MIME, fechas y enlaces
 */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  parents?: string[];
}

/**
 * Contenido extraído de un archivo de Google Drive
 * Incluye el contenido de texto y metadatos de extracción
 */
export interface FileContent {
  fileId: string;
  fileName: string;
  mimeType: string;
  content: string;
  extractedAt: string;
}

// ============================================================================
// Parámetros de herramientas MCP
// ============================================================================

/**
 * Parámetros para listar archivos de Google Drive
 * Soporta filtros por Drive, carpeta, fechas de modificación, tipo MIME y paginación
 */
export interface ListFilesParams {
  driveId?: string;
  folderId?: string;
  modifiedAfter?: string;
  modifiedBefore?: string;
  mimeType?: string;
  pageSize?: number;
}

/**
 * Parámetros para obtener el contenido de un archivo específico
 * Requiere ID del archivo, opcionalmente especifica el Drive
 */
export interface GetFileContentParams {
  fileId: string;
  driveId?: string;
}

// ============================================================================
// Tipos MIME soportados
// ============================================================================

/**
 * Constantes de tipos MIME soportados por el servidor
 * Incluye documentos de Google Workspace, archivos de texto y formatos de exportación
 */
export const SUPPORTED_MIME_TYPES = {
  // Google Workspace
  GOOGLE_DOC: "application/vnd.google-apps.document",
  GOOGLE_SHEET: "application/vnd.google-apps.spreadsheet",
  GOOGLE_SLIDE: "application/vnd.google-apps.presentation",

  // Text files
  TEXT_PLAIN: "text/plain",
  TEXT_MARKDOWN: "text/markdown",

  // Export formats
  EXPORT_TEXT: "text/plain",
  EXPORT_CSV: "text/csv",
} as const;
