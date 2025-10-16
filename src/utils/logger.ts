/**
 * Configuración del sistema de logging con Winston
 *
 * Proporciona logging estructurado con múltiples transportes:
 * - Consola con formato colorizado para desarrollo
 * - Archivo de errores (error.log) solo para nivel error
 * - Archivo combinado (combined.log) para todos los niveles
 *
 * El nivel de log se controla via variable de entorno LOG_LEVEL (default: info)
 */

import winston from "winston";

/**
 * Logger global de la aplicación
 * Usa formato JSON para archivos y formato legible para consola
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info", // Nivel configurable via env
  format: winston.format.combine(
    // Formato para archivos: JSON estructurado con timestamp
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Transporte de consola: formato colorizado y legible para desarrollo
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : "";
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
    // Archivo para errores críticos únicamente
    new winston.transports.File({ filename: "error.log", level: "error" }),
    // Archivo combinado con todos los niveles de log
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
