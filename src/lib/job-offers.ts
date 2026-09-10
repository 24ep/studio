import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { getSystemSetting } from '@/lib/systemSettings';
import {
  DEFAULT_OFFER_LETTER_SUBJECT,
  DEFAULT_OFFER_LETTER_TEMPLATE,
} from '@/lib/job-offer-template-defaults';

export {
  DEFAULT_OFFER_LETTER_SUBJECT,
  DEFAULT_OFFER_LETTER_TEMPLATE,
};

export interface JobOfferTemplateVariables {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  salary: string;
  startDate: string;
  companyName: string;
  acceptUrl: string;
}

export function hasVisibleOfferTemplateContent(template: string | null | undefined) {
  if (!template?.trim()) return false;

  const textContent = sanitizeHtml(template, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\u00a0/g, ' ')
    .trim();

  // Images are visible content even when the template contains no text.
  return textContent.length > 0 || /<img\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>/i.test(template);
}

export function createOfferToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function createOfferSignatureHash(input: {
  offerId: string;
  token: string;
  signedName: string;
  consentText: string;
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
}) {
  return crypto
    .createHash('sha256')
    .update([
      input.offerId,
      input.token,
      input.signedName.trim(),
      input.consentText,
      input.signedAt.toISOString(),
      input.ipAddress,
      input.userAgent,
    ].join('|'))
    .digest('hex');
}

export async function loadOfferLetterTemplateSettings() {
  const [subjectSetting, bodySetting, companySetting] = await Promise.all([
    getSystemSetting('emailTemplateOfferLetterSubject'),
    getSystemSetting('emailTemplateOfferLetter'),
    getSystemSetting('organizationName'),
  ]);

  return {
    subject: subjectSetting?.trim() || DEFAULT_OFFER_LETTER_SUBJECT,
    body: hasVisibleOfferTemplateContent(bodySetting) ? bodySetting! : DEFAULT_OFFER_LETTER_TEMPLATE,
    companyName: companySetting?.trim() || 'Recruitment Team',
  };
}

export function renderOfferTemplate(template: string, variables: JobOfferTemplateVariables) {
  return Object.entries(variables).reduce((rendered, [key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    return rendered.replace(pattern, value || '');
  }, template);
}

export function sanitizeOfferHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'span']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'style'],
      img: ['src', 'alt', 'width', 'height', 'style'],
      p: ['style'],
      span: ['style'],
      strong: ['style'],
      table: ['style'],
      td: ['style'],
      th: ['style'],
      tr: ['style'],
      div: ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
  });
}

export function formatOfferSalary(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'To be confirmed';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'THB',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatOfferDate(value: string | Date | null | undefined) {
  if (!value) return 'To be confirmed';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'To be confirmed';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date);
}
