import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { parseDocumentTemplates } from '@/lib/document-templates';
import { parseOrganizationProfile } from '@/lib/organization-profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await getPool().query<{ key: string; value: string }>(
    'SELECT key, value FROM "SystemSetting" WHERE key = ANY($1)',
    [['documentTemplates', 'organizationProfile', 'organizationLogoDataUrl']],
  );
  const values = Object.fromEntries(result.rows.map(row => [row.key, row.value]));
  const organization = parseOrganizationProfile(values.organizationProfile);
  const templates = parseDocumentTemplates(values.documentTemplates).filter(template => (
    template.status === 'active' && template.employeeCanDownload
  ));

  return NextResponse.json({
    templates,
    company: {
      name: organization.tradingName || organization.legalName,
      legalName: organization.legalName,
      address: [organization.addressLine1, organization.addressLine2, organization.city, organization.stateProvince, organization.postalCode, organization.country].filter(Boolean).join(', '),
      taxId: organization.taxId,
      hrContact: organization.primaryEmail,
      logo: values.organizationLogoDataUrl || '',
    },
  });
}
