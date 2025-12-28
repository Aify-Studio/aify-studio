import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user_table = sqliteTable("user", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
});
