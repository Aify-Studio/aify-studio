import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { type Settings, settingsSchema } from "@/shared/settings/settings.schema";

/**
 * 获取 .aify-studio 配置目录的路径
 */
export function getStudioConfigDir(): string {
  return path.join(homedir(), ".aify-studio");
}

/**
 * 获取 settings.json 文件的路径
 */
export function getSettingsFilePath(): string {
  return path.join(getStudioConfigDir(), "settings.json");
}

/**
 * 从 .aify-studio/settings.json 加载并验证配置
 * @throws 如果文件不存在或验证失败会抛出错误
 * @returns 验证后的配置对象
 */
export function loadSettings(): Settings {
  const settingsFilePath = getSettingsFilePath();

  try {
    const fileContent = readFileSync(settingsFilePath, "utf-8");
    const parsedData = JSON.parse(fileContent);

    // 使用 Zod schema 验证数据
    const validatedSettings = settingsSchema.parse(parsedData);

    return validatedSettings;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse settings.json: ${error.message}`);
    }

    if (error instanceof Error) {
      if (error.message.includes("ENOENT")) {
        console.warn(`Settings file not found at ${settingsFilePath}, using default settings`);
        return settingsSchema.parse({});
      }

      throw error;
    }

    throw new Error("Unknown error while loading settings");
  }
}

/**
 * 安全加载设置，失败时返回默认值而不是抛出错误
 */
export function loadSettingsSafe(): Settings {
  try {
    return loadSettings();
  } catch (error) {
    console.error("Failed to load settings, using defaults:", error instanceof Error ? error.message : String(error));
    return settingsSchema.parse({});
  }
}
