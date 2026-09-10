import { describe, expect, it } from 'vitest';

import { isFullPageWorkspacePath, isPolicyDocumentEditorPath } from './full-page-routes';

describe('isPolicyDocumentEditorPath', () => {
  it('matches existing and new policy document editors', () => {
    expect(isPolicyDocumentEditorPath('/policy-documents/common-workplace-policy')).toBe(true);
    expect(isPolicyDocumentEditorPath('/policy-documents/new/')).toBe(true);
  });

  it('keeps the policy document list in the standard app shell', () => {
    expect(isPolicyDocumentEditorPath('/policy-documents')).toBe(false);
    expect(isPolicyDocumentEditorPath('/policy-documents/one/history')).toBe(false);
    expect(isPolicyDocumentEditorPath(null)).toBe(false);
  });
});

describe('isFullPageWorkspacePath', () => {
  it('keeps settings pages in the standard app shell', () => {
    expect(isFullPageWorkspacePath('/settings')).toBe(false);
    expect(isFullPageWorkspacePath('/settings/branches')).toBe(false);
    expect(isFullPageWorkspacePath('/settings/branches/')).toBe(false);
    expect(isFullPageWorkspacePath('/settings/data-configuration')).toBe(false);
  });

  it('keeps policy document editors as full-page workspaces', () => {
    expect(isFullPageWorkspacePath('/policy-documents/new')).toBe(true);
  });

  it('keeps public candidate journeys outside the authenticated app shell', () => {
    expect(isFullPageWorkspacePath('/apply')).toBe(true);
    expect(isFullPageWorkspacePath('/apply/software-engineer')).toBe(true);
    expect(isFullPageWorkspacePath('/offer/example-token')).toBe(true);
  });
});
