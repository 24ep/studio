import { z } from "zod";

import { SYSTEM_SETTING_KEYS } from "./system-settings-route-keys";

export const systemSettingKeyEnum = z.enum(SYSTEM_SETTING_KEYS);

export const systemSettingSchema = z.object({
  key: systemSettingKeyEnum,
  value: z.string().nullable(),
});

export const saveSystemSettingsSchema = z.array(systemSettingSchema);
