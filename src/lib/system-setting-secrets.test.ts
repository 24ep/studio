import { describe, expect, it } from 'vitest';

import {
  MASKED_SYSTEM_SETTING_VALUE,
  maskSystemSettingSecrets,
} from './system-setting-secrets';

describe('system setting secrets', () => {
  it('masks configured secrets without changing ordinary settings', () => {
    expect(maskSystemSettingSecrets({
      emailSmtpHost: 'smtp.example.com',
      appkitApiKey: 'appkit-secret',
      emailSmtpPassword: 'secret',
      broadcastSmsTwilioAuthToken: 'token',
      broadcastSmsWebhookToken: '',
    })).toEqual({
      emailSmtpHost: 'smtp.example.com',
      appkitApiKey: MASKED_SYSTEM_SETTING_VALUE,
      emailSmtpPassword: MASKED_SYSTEM_SETTING_VALUE,
      broadcastSmsTwilioAuthToken: MASKED_SYSTEM_SETTING_VALUE,
      broadcastSmsWebhookToken: '',
    });
  });
});
