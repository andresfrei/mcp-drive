/**
 * Gestor de configuración de cuentas de Google Drive
 *
 * Proporciona funcionalidades para:
 * - Cargar y validar configuración desde JSON
 * - Administrar múltiples cuentas de Drive
 * - Agregar/eliminar Drives dinámicamente
 * - Validar existencia de archivos de cuenta de servicio
 *
 * La configuración se almacena en drives-config.json (configurable via DRIVES_CONFIG_PATH)
 */

import fs from "fs";
import path from "path";
import { logger } from "@/utils/logger.js";
import { DrivesConfig, DrivesConfigSchema } from "@/config/types.js";

/** Ruta del archivo de configuración (configurable via variable de entorno) */
const CONFIG_PATH = process.env.DRIVES_CONFIG_PATH || "./drives-config.json";

/**
 * Clase para gestión de configuración de Drives
 * Implementa patrón singleton via exportación de instancia única
 */
export class DrivesConfigLoader {
  /** Configuración cargada en memoria (cache) */
  private config: DrivesConfig | null = null;

  /**
   * Carga y valida la configuración desde el archivo JSON
   *
   * Proceso:
   * 1. Lee el archivo de configuración
   * 2. Valida estructura con esquema Zod
   * 3. Verifica existencia de archivos de cuenta de servicio
   * 4. Cachea configuración en memoria
   *
   * @returns Configuración validada de todos los Drives
   * @throws Error si el archivo no existe, JSON inválido, o archivos SA no encontrados
   */
  load(): DrivesConfig {
    try {
      const configPath = path.resolve(CONFIG_PATH);

      // Crear archivo con estructura vacía si no existe
      if (!fs.existsSync(configPath)) {
        const emptyConfig: DrivesConfig = { drives: {} };
        fs.writeFileSync(configPath, JSON.stringify(emptyConfig, null, 2));
        logger.info(`Created empty config file at ${configPath}`);
        this.config = emptyConfig;
        return emptyConfig;
      }

      const rawConfig = fs.readFileSync(configPath, "utf-8");
      const parsedConfig = JSON.parse(rawConfig);

      // Validar estructura con Zod para garantizar tipos correctos
      this.config = DrivesConfigSchema.parse(parsedConfig);

      // Validar archivos de cuenta de servicio solo si usan serviceAccountPath
      for (const [driveId, driveConfig] of Object.entries(this.config.drives)) {
        if (driveConfig.serviceAccountPath) {
          const saPath = path.resolve(driveConfig.serviceAccountPath);
          if (!fs.existsSync(saPath)) {
            throw new Error(
              `Service account file not found for drive "${driveId}": ${saPath}`
            );
          }
        }
        // Si usa credentials inline, no hay archivo que validar
      }

      logger.info(
        `Loaded config for ${Object.keys(this.config.drives).length} drives`
      );
      return this.config;
    } catch (error) {
      logger.error("Failed to load drives config", { error });
      throw error;
    }
  }

  /**
   * Obtiene la configuración (carga si no está en cache)
   *
   * @returns Configuración actual de todos los Drives
   */
  getConfig(): DrivesConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  /**
   * Obtiene la configuración de un Drive específico
   *
   * @param driveId - Identificador único del Drive
   * @returns Configuración del Drive solicitado
   * @throws Error si el Drive no existe
   */
  getDriveConfig(driveId: string) {
    const config = this.getConfig();
    const driveConfig = config.drives[driveId];

    if (!driveConfig) {
      throw new Error(`Drive not found: ${driveId}`);
    }

    return driveConfig;
  }

  /**
   * Lista todos los Drives configurados
   *
   * @returns Array con resumen de cada Drive (id, nombre, descripción)
   */
  listDrives() {
    const config = this.getConfig();
    return Object.entries(config.drives).map(([id, cfg]) => ({
      id,
      name: cfg.name,
      description: cfg.description,
    }));
  }

  /**
   * Agrega un nuevo Drive a la configuración
   *
   * @param driveId - Identificador único para el nuevo Drive
   * @param driveConfig - Configuración del Drive (nombre, descripción, ruta SA)
   * @returns Configuración del Drive agregado
   * @throws Error si el driveId ya existe
   */
  addDrive(
    driveId: string,
    driveConfig: {
      name: string;
      description?: string;
      serviceAccountPath: string;
    }
  ) {
    const config = this.getConfig();

    if (config.drives[driveId]) {
      throw new Error(`Drive "${driveId}" already exists`);
    }

    config.drives[driveId] = driveConfig;
    this.saveConfig(config);

    logger.info(`Added drive: ${driveId}`);
    return driveConfig;
  }

  /**
   * Elimina un Drive de la configuración
   *
   * @param driveId - Identificador del Drive a eliminar
   * @throws Error si el Drive no existe
   */
  removeDrive(driveId: string) {
    const config = this.getConfig();

    if (!config.drives[driveId]) {
      throw new Error(`Drive "${driveId}" not found`);
    }

    delete config.drives[driveId];
    this.saveConfig(config);

    logger.info(`Removed drive: ${driveId}`);
  }

  /**
   * Guarda la configuración en el archivo JSON
   * Actualiza tanto el archivo como el cache en memoria
   *
   * @param config - Configuración completa a guardar
   */
  private saveConfig(config: DrivesConfig) {
    const configPath = path.resolve(CONFIG_PATH);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }
}

/** Instancia singleton del gestor de configuración (patrón singleton) */
export const drivesConfigLoader = new DrivesConfigLoader();
