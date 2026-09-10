import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSystemSettingMock } = vi.hoisted(() => ({
  getSystemSettingMock: vi.fn(),
}));

vi.mock('@/lib/systemSettings', () => ({
  getSystemSetting: getSystemSettingMock,
}));

import {
  DEFAULT_OFFER_LETTER_SUBJECT,
  DEFAULT_OFFER_LETTER_TEMPLATE,
  hasVisibleOfferTemplateContent,
  loadOfferLetterTemplateSettings,
} from '@/lib/job-offers';

describe('job offer template settings', () => {
  beforeEach(() => {
    getSystemSettingMock.mockReset();
  });

  it.each(['', '   ', '<p></p>', '<p><br></p>', '<div>&nbsp;</div>'])(
    'treats %j as an empty rich-text template',
    (template) => {
      expect(hasVisibleOfferTemplateContent(template)).toBe(false);
    },
  );

  it('recognizes text and images as visible content', () => {
    expect(hasVisibleOfferTemplateContent('<p>Welcome</p>')).toBe(true);
    expect(hasVisibleOfferTemplateContent('<img src="https://example.com/offer.png">')).toBe(true);
  });

  it('falls back to the default subject and body when saved settings are visually blank', async () => {
    getSystemSettingMock
      .mockResolvedValueOnce('   ')
      .mockResolvedValueOnce('<p><br></p>')
      .mockResolvedValueOnce('Acme');

    await expect(loadOfferLetterTemplateSettings()).resolves.toEqual({
      subject: DEFAULT_OFFER_LETTER_SUBJECT,
      body: DEFAULT_OFFER_LETTER_TEMPLATE,
      companyName: 'Acme',
    });
  });
});
