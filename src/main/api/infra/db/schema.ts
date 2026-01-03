import { randomUUID } from "node:crypto";
import type { InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const chat_table = sqliteTable("chat", {
  id: text("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export type Chat = InferSelectModel<typeof chat_table>;

export const message_table = sqliteTable("message", {
  id: text("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  chatId: text("chat_id"),
  role: text("role").notNull(),
  parts: text("parts", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export type Message = InferSelectModel<typeof message_table>;
