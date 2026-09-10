import { describe, expect, it } from 'vitest';

import { parseDocumentTemplates } from './document-templates';

const template = {
  id: 'template-1',
  name: 'Employment letter',
  description: '',
  category: 'Employment',
  content: '<p>Letter</p>',
  status: 'active',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('parseDocumentTemplates', () => {
  it('defaults legacy templates to not confidential', () => {
    expect(parseDocumentTemplates(JSON.stringify([template]))[0].isConfidential).toBe(false);
  });

  it('defaults legacy templates to employee download access', () => {
    expect(parseDocumentTemplates(JSON.stringify([template]))[0].employeeCanDownload).toBe(true);
  });

  it('preserves a confidential template setting', () => {
    expect(parseDocumentTemplates(JSON.stringify([{ ...template, isConfidential: true }]))[0].isConfidential).toBe(true);
  });

  it('preserves a blocked employee download setting', () => {
    expect(parseDocumentTemplates(JSON.stringify([{ ...template, employeeCanDownload: false }]))[0].employeeCanDownload).toBe(false);
  });
});
