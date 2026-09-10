import {
  getJsonErrorMessage,
  readJsonObject,
  readJsonOrFallback,
} from '../../../lib/response-json';
import type { CompanyReference } from '../../../lib/types';

export type CompanyReferenceFormData = {
  name: string;
  legalName?: string | null;
  logo?: string | null;
  website?: string | null;
  domain?: string | null;
  industry?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export async function fetchCompanyReferences() {
  const response = await fetch('/api/settings/company-references');
  if (!response.ok) {
    throw new Error(`Failed to fetch company references: ${response.status}`);
  }

  return readJsonOrFallback<CompanyReference[]>(response, []);
}

export async function saveCompanyReference(
  data: CompanyReferenceFormData,
  editingCompany: CompanyReference | null,
) {
  const response = await fetch(
    editingCompany
      ? `/api/settings/company-references/${editingCompany.id}`
      : '/api/settings/company-references',
    {
      method: editingCompany ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        source: editingCompany?.source || 'manual',
        externalId: editingCompany?.externalId || null,
        appkitAppId: editingCompany?.appkitAppId || null,
        metadata: editingCompany?.metadata || {},
      }),
    },
  );

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to save company reference'));
  }

  return readJsonOrFallback<CompanyReference>(response, editingCompany ?? {} as CompanyReference);
}

export async function deleteCompanyReference(companyId: string) {
  const response = await fetch(`/api/settings/company-references/${companyId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to delete company reference'));
  }
}

export async function loadCompanyReferenceFromAppKit(environment: 'development' | 'production') {
  const response = await fetch('/api/settings/company-references/import-appkit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ environment }),
  });

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to load company reference from AppKit'));
  }

  return readJsonOrFallback<{
    companies: CompanyReference[];
    created: number;
    updated: number;
    total: number;
  }>(response, { companies: [], created: 0, updated: 0, total: 0 });
}
