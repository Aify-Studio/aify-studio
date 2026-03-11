import { eq } from "drizzle-orm";
import { db } from "../infra/db";
import { settings_table } from "../infra/db/schema";

export async function getAllSettings() {
  return await db.select().from(settings_table);
}

export async function getSettingByKey(key: string) {
  const [setting] = await db.select().from(settings_table).where(eq(settings_table.key, key)).limit(1);

  return setting ?? null;
}

export async function createSetting({
  key,
  value,
  defaultValue,
}: {
  key: string;
  value: string;
  defaultValue?: unknown;
}) {
  const now = new Date();
  return await db.insert(settings_table).values({
    key,
    value,
    defaultValue,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateSettingByKey(key: string, value: string) {
  return await db
    .update(settings_table)
    .set({
      value,
      updatedAt: new Date(),
    })
    .where(eq(settings_table.key, key));
}

export async function upsertSetting({
  key,
  value,
  defaultValue,
}: {
  key: string;
  value: string;
  defaultValue?: unknown;
}) {
  const existing = await getSettingByKey(key);

  if (existing) {
    return await updateSettingByKey(key, value);
  }

  return await createSetting({ key, value, defaultValue });
}

export async function deleteSettingByKey(key: string) {
  return await db.delete(settings_table).where(eq(settings_table.key, key));
}
