import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { app } from "electron";
import * as schema from "./schema";

const dbPath = process.env.NODE_ENV === "development" ? "./data.db" : path.join(app.getPath("userData"), "data.db");
const migrationsFolder = path.join(__dirname, "./migrations");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const client = createClient({ url: `file:${dbPath}` });

export const db = drizzle(client, { schema });

export const runMigrate = async () => {
  migrate(db, {
    migrationsFolder,
  });
};
