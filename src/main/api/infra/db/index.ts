// import 'dotenv/config';
// import { drizzle } from 'drizzle-orm/libsql';

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
// // You can specify any property from the libsql connection options
// const db = drizzle({ connection: { url: process.env.DB_FILE_NAME! }});
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { app } from "electron";
import * as schema from "./schema";

const dbPath = process.env.NODE_ENV === "development" ? "./data.db" : path.join(app.getPath("userData"), "data.db");
const migrationsFolder = path.join(__dirname, "./migrations");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

export const runMigrate = async () => {
  migrate(db, {
    migrationsFolder,
  });
};
