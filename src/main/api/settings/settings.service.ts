import { ORPCError, os } from "@orpc/server";
import z from "zod";
import {
  createSetting,
  deleteSettingByKey,
  getAllSettings,
  getSettingByKey,
  updateSettingByKey,
  upsertSetting,
} from "./settings.repository";

export const getAllSettingsRoute = os.route({ method: "GET", path: "/settings" }).handler(async () => {
  return await getAllSettings();
});

export const getSettingRoute = os
  .route({ method: "GET", path: "/settings/{key}" })
  .input(z.object({ key: z.string() }))
  .handler(async ({ input }) => {
    const { key } = input;
    const setting = await getSettingByKey(key);

    if (!setting) {
      throw new ORPCError("NOT_FOUND", {
        message: `Setting with key "${key}" not found.`,
      });
    }

    return setting;
  });

export const createSettingRoute = os
  .route({ method: "POST", path: "/settings" })
  .input(
    z.object({
      key: z.string(),
      value: z.string(),
      defaultValue: z.unknown().optional(),
    })
  )
  .handler(async ({ input }) => {
    const { key, value, defaultValue } = input;

    // 检查是否已存在
    const existing = await getSettingByKey(key);
    if (existing) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Setting with key "${key}" already exists.`,
      });
    }

    await createSetting({ key, value, defaultValue });

    return { success: true, key };
  });

export const updateSettingRoute = os
  .route({ method: "PUT", path: "/settings/{key}" })
  .input(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const { key, value } = input;

    // 检查是否存在
    const existing = await getSettingByKey(key);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: `Setting with key "${key}" not found.`,
      });
    }

    await updateSettingByKey(key, value);

    return { success: true, key };
  });

export const upsertSettingRoute = os
  .route({ method: "PUT", path: "/settings/{key}/upsert" })
  .input(
    z.object({
      key: z.string(),
      value: z.string(),
      defaultValue: z.unknown().optional(),
    })
  )
  .handler(async ({ input }) => {
    const { key, value, defaultValue } = input;

    await upsertSetting({ key, value, defaultValue });

    return { success: true, key };
  });

export const deleteSettingRoute = os
  .route({ method: "DELETE", path: "/settings/{key}" })
  .input(z.object({ key: z.string() }))
  .handler(async ({ input }) => {
    const { key } = input;

    // 检查是否存在
    const existing = await getSettingByKey(key);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: `Setting with key "${key}" not found.`,
      });
    }

    await deleteSettingByKey(key);

    return { success: true, key };
  });
