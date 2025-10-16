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
 * Esquema Zod para credenciales de Service Account inline
 */
export const ServiceAccountCredentialsSchema = z.object({
  type: z.literal("service_account"),
  project_id: z.string(),
  private_key_id: z.string(),
  private_key: z.string(),
  client_email: z.string(),
  client_id: z.string(),
  auth_uri: z.string(),
  token_uri: z.string(),
  auth_provider_x509_cert_url: z.string(),
  client_x509_cert_url: z.string(),
  universe_domain: z.string().optional(),
});

/**
 * Esquema Zod para la configuración individual de un Drive
 * Soporta credenciales inline O ruta a archivo de service account
 */
export const DriveConfigSchema = z
  .object({
    name: z.string().optional(),
    driveId: z.string().optional(),
    description: z.string().optional(),
    rootFolderId: z.string().optional(),
    // Credenciales inline (objeto JSON completo)
    credentials: ServiceAccountCredentialsSchema.optional(),
    // O ruta a archivo de service account
    serviceAccountPath: z.string().optional(),
  })
  .refine((data) => data.credentials || data.serviceAccountPath, {
    message:
      "Se requiere 'credentials' (inline) o 'serviceAccountPath' (archivo)",
  });

/**
 * Esquema Zod para la configuración completa de todos los Drives
 * Estructura: diccionario de ID de Drive → configuración individual
 */
export const DrivesConfigSchema = z.object({
  drives: z.record(z.string(), DriveConfigSchema),
});

/** Tipo inferido: credenciales de service account */
export type ServiceAccountCredentials = z.infer<
  typeof ServiceAccountCredentialsSchema
>;

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
