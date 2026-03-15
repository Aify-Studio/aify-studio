import { randomUUID } from "node:crypto";
import { type InferSelectModel, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const chat_table = sqliteTable("chat", {
  id: text("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export type ChatModel = InferSelectModel<typeof chat_table>;

export const message_table = sqliteTable("message", {
  id: text("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  chatId: text("chat_id"),
  role: text("role").notNull(),
  parts: text("parts", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export type MessageModel = InferSelectModel<typeof message_table>;

export const ai_provider_table = sqliteTable("ai_provider", {
  id: text("id", { length: 255 }).primaryKey(),
  name: text("name").notNull(),
  desc: text("desc"),
  doc: text("doc"),
  type: text("type").notNull(),
  api: text("api"),
  apiKey: text("api_key"),
  logo: text("logo"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export type AIProviderModel = InferSelectModel<typeof ai_provider_table>;

export const ai_model_table = sqliteTable("ai_model", {
  id: text("id", { length: 255 }).primaryKey(),
  providerId: text("provider_id").notNull(),
  name: text("name").notNull(),
  attachment: integer("attachment", { mode: "boolean" }).notNull(),
  reasoning: integer("reasoning", { mode: "boolean" }).notNull(),
  toolCall: integer("tool_call", { mode: "boolean" }).notNull(),
  structuredOutput: integer("structured_output", { mode: "boolean" }),
  temperature: integer("temperature", { mode: "boolean" }),
  interleaved: text("interleaved", {
    enum: ["reasoning_content", "reasoning_details"],
  }),
  cost: text("cost", { mode: "json" }).notNull(),
  limit: text("limit", { mode: "json" }).notNull(),
  modalities: text("modalities", { mode: "json" }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export type AIModelModel = InferSelectModel<typeof ai_model_table>;

export const settings_table = sqliteTable("settings", {
  key: text("id", { length: 255 }).primaryKey(),
  value: text("value").notNull(),
  defaultValue: text("default_value", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export type SettingsModel = InferSelectModel<typeof settings_table>;
