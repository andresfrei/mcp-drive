/**
 * Módulo de autenticación para el servidor MCP
 *
 * Gestiona la validación de API keys para requests entrantes.
 * Si no hay API key configurado, permite acceso sin autenticación.
 */

import { logger } from "@/utils/logger.js";

/** API key opcional para autenticación de requests MCP */
const MCP_API_KEY = process.env.MCP_API_KEY;

/**
 * Valida el API key de una request MCP
 *
 * Comportamiento:
 * - Si MCP_API_KEY no está configurado → permite acceso (sin autenticación)
 * - Si está configurado → valida que el key de la request coincida
 *
 * @param requestApiKey - API key enviado en la request
 * @returns true si es válido o no hay autenticación configurada, false si es inválido
 */
export function validateApiKey(requestApiKey?: string): boolean {
  // Si no hay API key configurado, permitir acceso sin autenticación
  if (!MCP_API_KEY) {
    logger.warn("MCP_API_KEY not configured - running without authentication");
    return true;
  }

  // Validar que el API key coincida
  if (!requestApiKey || requestApiKey !== MCP_API_KEY) {
    logger.warn("Invalid or missing API key");
    return false;
  }

  return true;
}
