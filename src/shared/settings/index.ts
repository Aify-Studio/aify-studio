import type { Settings } from "@/shared/settings/settings.schema";
import { loadSettingsSafe } from "./config-loader";

/**
 * 全局配置实例
 */
let globalSettings: Settings | null = null;

/**
 * 初始化全局配置（在应用启动时调用一次）
 */
export function initializeSettings(): Settings {
  globalSettings = loadSettingsSafe();
  return globalSettings;
}

/**
 * 获取当前的全局配置
 */
export function getSettings(): Settings {
  if (!globalSettings) {
    throw new Error("Settings not initialized. Call initializeSettings() first.");
  }

  return globalSettings;
}

/**
 * 获取特定的配置字段
 */
export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  return getSettings()[key];
}
