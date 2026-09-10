import { EMAIL_TEMPLATE_REQUIREMENTS } from './email-template-requirements';
import { getEmailTemplateAttributes } from './email-template-attributes';

export type EmailTemplateVersionStatus = 'draft' | 'active';

export type EmailTemplateVersion = {
  version: number;
  status: EmailTemplateVersionStatus;
  subject: string;
  html: string;
  text: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
};

export type RequiredEmailTemplate = {
  code: string;
  name: string;
  category: string;
  description: string;
  required: true;
  versions: EmailTemplateVersion[];
};

const SEEDED_AT = '2026-08-01T00:00:00.000Z';
const SEEDED_DATE_LABEL = new Date(SEEDED_AT).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const CORP_BRAND = {
  name: 'Hrive',
  footer: 'Internal communication - For recipient use only',
};

export function createSeededEmailTemplateCatalog(): RequiredEmailTemplate[] {
  return EMAIL_TEMPLATE_REQUIREMENTS.map(requirement => ({
    ...requirement,
    versions: [{
      version: 1,
      status: 'active' as const,
      subject: requirement.name,
      html: buildSeedTemplateHtml(requirement.name, requirement.description),
      text: `${requirement.name}\n\n${requirement.description}`,
      variables: getEmailTemplateAttributes(requirement.code).map(attribute => attribute.key),
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
    }],
  }));
}

export function buildSeedTemplateHtml(title: string, description: string, details = '') {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const safeDetails = details || `<p style="margin: 16px 0 0;">Regards,<br/>${CORP_BRAND.name} HR</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapedTitle}</title>
</head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'DM Sans',sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:20px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background-color:#ffffff;border:1px solid #d1d5db;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background-color:#0f172a;color:#ffffff;padding:16px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;text-align:left;font-size:16px;line-height:1.4;font-weight:700;">${CORP_BRAND.name} / ${escapedTitle}</td>
                  <td style="width:50%;text-align:right;font-size:12px;line-height:1.6;color:#dbeafe;">Document date: ${SEEDED_DATE_LABEL}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;color:#1f2937;line-height:1.6;">
              <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapedTitle}</h2>
              <p style="margin:0 0 12px;">${escapedDescription}</p>
              ${safeDetails}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;font-size:11px;line-height:1.4;color:#4b5563;text-align:left;">&copy; ${new Date(SEEDED_AT).getUTCFullYear()} ${CORP_BRAND.name}</td>
                  <td style="width:50%;font-size:11px;line-height:1.4;color:#4b5563;text-align:right;">${CORP_BRAND.footer}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function parseRequiredEmailTemplateCatalog(value: string | null): RequiredEmailTemplate[] {
  let stored: unknown[] = [];
  try {
    const parsed: unknown = value ? JSON.parse(value) : [];
    if (Array.isArray(parsed)) stored = parsed;
  } catch {
    // A malformed legacy setting is safely replaced by the deploy seed catalog.
  }

  const seeded = createSeededEmailTemplateCatalog();
  return seeded.map(fallback => {
    const raw = stored.find(item => isRecord(item) && item.code === fallback.code);
    if (!isRecord(raw)) return fallback;

    const rawVersions = Array.isArray(raw.versions)
      ? raw.versions
      : [raw]; // Migrate the former flat AppKit catalog in place.
    const defaultVariables = fallback.versions[0].variables;
    const versions = rawVersions
      .map((version, index) => normalizeVersion(version, index + 1, defaultVariables))
      .filter((version): version is EmailTemplateVersion => version !== null)
      .sort((a, b) => b.version - a.version);

    return { ...fallback, versions: enforceSingleActiveVersion(versions.length ? versions : fallback.versions) };
  });
}

export function getActiveEmailTemplateVersions(value: string | null) {
  return parseRequiredEmailTemplateCatalog(value).flatMap(template => {
    const active = template.versions.find(version => version.status === 'active' && version.html.trim());
    return active ? [{ ...template, ...active, versions: undefined }] : [];
  });
}

export function enforceSingleActiveVersion(versions: EmailTemplateVersion[]): EmailTemplateVersion[] {
  let foundActive = false;
  return versions.map(version => {
    if (version.status !== 'active') return version;
    if (!foundActive) {
      foundActive = true;
      return version;
    }
    return { ...version, status: 'draft' };
  });
}

function normalizeVersion(value: unknown, fallbackVersion: number, defaultVariables: string[]): EmailTemplateVersion | null {
  if (!isRecord(value)) return null;
  const html = String(value.html || '');
  const subject = String(value.subject || '');
  if (!html.trim() && !subject.trim()) return null;
  const timestamp = typeof value.updatedAt === 'string' ? value.updatedAt : SEEDED_AT;
  return {
    version: Math.max(1, Math.trunc(Number(value.version) || fallbackVersion)),
    status: value.status === 'draft' || value.isActive === false ? 'draft' : 'active',
    subject,
    html,
    text: String(value.text || ''),
    variables: Array.isArray(value.variables) && value.variables.length
      ? value.variables.map(String)
      : defaultVariables,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : timestamp,
    updatedAt: timestamp,
  };
}

function buildSeedHtml(name: string, description: string) {
  return buildSeedTemplateHtml(name, description);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}
