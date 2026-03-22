import { z } from "zod";
import { ThemeMode } from "@/shared/constants";

export const settingsSchema = z.object({
  // 主题设置
  theme: z.enum([ThemeMode.Light, ThemeMode.Dark, ThemeMode.System]).optional().default(ThemeMode.System),

  // 语言设置
  language: z.string().optional().default("zh-CN"),

  // AI 提供商设置
  aiProvider: z.string().optional(),
  aiModel: z.string().optional(),

  // 其他自定义设置可在此添加
  customSettings: z.record(z.string(), z.unknown()).optional().default({}),
});

export type Settings = z.infer<typeof settingsSchema>;
