import { describe, expect, it } from 'vitest';

import { EMAIL_TEMPLATE_REQUIREMENTS } from './email-template-requirements';
import { parseRequiredEmailTemplateCatalog } from './email-template-catalog';

describe('required email template catalog', () => {
  it('seeds every required Hrive template and excludes custom codes', () => {
    const catalog = parseRequiredEmailTemplateCatalog(JSON.stringify([
      { code: 'application_received', subject: 'Legacy', html: '<p>Legacy</p>', isActive: true },
      { code: 'custom', subject: 'Custom', html: '<p>Custom</p>', isActive: true },
    ]));

    expect(catalog).toHaveLength(EMAIL_TEMPLATE_REQUIREMENTS.length);
    expect(catalog.some(template => template.code === 'custom')).toBe(false);
    expect(catalog.find(template => template.code === 'application_received')?.versions[0]).toEqual(
      expect.objectContaining({
        version: 1,
        status: 'active',
        subject: 'Legacy',
        variables: expect.arrayContaining(['applicantName', 'positionTitle']),
      }),
    );
  });

  it('keeps only the newest active version active', () => {
    const catalog = parseRequiredEmailTemplateCatalog(JSON.stringify([{
      code: 'offer_letter',
      versions: [
        { version: 2, status: 'active', subject: 'V2', html: '<p>V2</p>' },
        { version: 1, status: 'active', subject: 'V1', html: '<p>V1</p>' },
      ],
    }]));
    const versions = catalog.find(template => template.code === 'offer_letter')!.versions;

    expect(versions.map(version => version.status)).toEqual(['active', 'draft']);
  });
});
