import {
  createSettingRoute,
  deleteSettingRoute,
  getAllSettingsRoute,
  getSettingRoute,
  updateSettingRoute,
  upsertSettingRoute,
} from "./settings.service";

export const settings = {
  getAll: getAllSettingsRoute,
  get: getSettingRoute,
  create: createSettingRoute,
  update: updateSettingRoute,
  upsert: upsertSettingRoute,
  delete: deleteSettingRoute,
};
