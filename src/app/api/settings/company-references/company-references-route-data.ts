import { v4 as uuidv4 } from 'uuid';

import { fetchAppKitSeedCollection } from '@/lib/appkit-sdk-client';
import { getPool } from '@/lib/db';
import type {
  AppKitImportInput,
  CompanyReferenceInput,
  CompanyReferenceRow,
} from './company-references-route-schema';

const COMPANY_REFERENCE_SELECT = `
  SELECT
    id,
    name,
    legal_name as "legalName",
    logo,
    website,
    domain,
    industry,
    description,
    email,
    phone,
    address,
    country,
    metadata,
    source,
    external_id as "externalId",
    appkit_app_id as "appkitAppId",
    sort_order as "sortOrder",
    is_active as "isActive",
    "createdAt",
    "updatedAt"
  FROM "CompanyReference"
`;

export async function fetchCompanyReferences() {
  const result = await getPool().query<CompanyReferenceRow>(`
    ${COMPANY_REFERENCE_SELECT}
    ORDER BY sort_order ASC, name ASC
  `);

  return result.rows;
}

export async function companyReferenceNameExists(name: string, exceptId?: string) {
  const result = await getPool().query<{ id: string }>(
    `SELECT id FROM "CompanyReference" WHERE lower(name) = lower($1) AND ($2::uuid IS NULL OR id <> $2::uuid)`,
    [name, exceptId || null],
  );

  return result.rows.length > 0;
}

export async function createCompanyReference(input: CompanyReferenceInput) {
  const id = uuidv4();
  const result = await getPool().query<CompanyReferenceRow>(`
    INSERT INTO "CompanyReference" (
      id, name, legal_name, logo, website, domain, industry, description, email,
      phone, address, country, metadata, source, external_id, appkit_app_id,
      sort_order, is_active, "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13::jsonb, $14, $15, $16,
      $17, $18, NOW(), NOW()
    )
    RETURNING
      id, name, legal_name as "legalName", logo, website, domain, industry,
      description, email, phone, address, country, metadata, source,
      external_id as "externalId", appkit_app_id as "appkitAppId",
      sort_order as "sortOrder", is_active as "isActive", "createdAt", "updatedAt"
  `, buildCompanyReferenceParams(id, input));

  return result.rows[0];
}

export async function updateCompanyReference(id: string, input: CompanyReferenceInput) {
  const result = await getPool().query<CompanyReferenceRow>(`
    UPDATE "CompanyReference"
    SET
      name = $2,
      legal_name = $3,
      logo = $4,
      website = $5,
      domain = $6,
      industry = $7,
      description = $8,
      email = $9,
      phone = $10,
      address = $11,
      country = $12,
      metadata = $13::jsonb,
      source = $14,
      external_id = $15,
      appkit_app_id = $16,
      sort_order = $17,
      is_active = $18,
      "updatedAt" = NOW()
    WHERE id = $1::uuid
    RETURNING
      id, name, legal_name as "legalName", logo, website, domain, industry,
      description, email, phone, address, country, metadata, source,
      external_id as "externalId", appkit_app_id as "appkitAppId",
      sort_order as "sortOrder", is_active as "isActive", "createdAt", "updatedAt"
  `, buildCompanyReferenceParams(id, input));

  return result.rows[0] || null;
}

export async function deleteCompanyReference(id: string) {
  const result = await getPool().query(
    'DELETE FROM "CompanyReference" WHERE id = $1::uuid',
    [id],
  );

  return (result.rowCount || 0) > 0;
}

export async function importCompanyReferenceFromAppKit(input: AppKitImportInput) {
  const appKitCompanies = await fetchAppKitSeedCollection<CompanyReferenceInput & {
    contactEmail?: string | null;
    logoUrl?: string | null;
  }>(input.environment, 'company_reference');
  if (appKitCompanies.length === 0) {
    throw new Error(`No records found in AppKit company_reference for ${input.environment}.`);
  }

  const companies: CompanyReferenceRow[] = [];
  let created = 0;
  let updated = 0;

  for (const seed of appKitCompanies) {
    const sourceInput = normalizeCompanyReferenceSeed(seed, input.environment);
    const existing = await getPool().query<{ id: string }>(
      `SELECT id FROM "CompanyReference"
       WHERE ($1::text IS NOT NULL AND external_id = $1)
          OR lower(name) = lower($2)
          OR ($3::text IS NOT NULL AND lower(domain) = lower($3))
       ORDER BY CASE WHEN external_id = $1 THEN 0 WHEN lower(name) = lower($2) THEN 1 ELSE 2 END
       LIMIT 1`,
      [sourceInput.externalId, sourceInput.name, sourceInput.domain],
    );

    if (existing.rows[0]?.id) {
      const company = await updateCompanyReference(existing.rows[0].id, sourceInput);
      if (company) companies.push(company);
      updated += 1;
    } else {
      companies.push(await createCompanyReference(sourceInput));
      created += 1;
    }
  }

  return { companies, created, updated, total: companies.length };
}

function asNullableString(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  return null;
}

function asSeedString(source: Record<string, unknown>, fieldNames: string[]): string | null {
  for (const field of fieldNames) {
    const value = asNullableString(source[field]);
    if (value !== null) return value;
  }
  return null;
}

function asSeedNumber(source: Record<string, unknown>, fieldNames: string[]): number | null {
  for (const field of fieldNames) {
    const value = source[field];
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

function asSeedBoolean(source: Record<string, unknown>, fieldNames: string[], fallback: boolean): boolean {
  for (const field of fieldNames) {
    const value = source[field];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
  }
  return fallback;
}

function normalizeCompanyReferenceSeed(
  source: AppKitCompanySeed | undefined,
  environment: AppKitImportInput['environment'],
): CompanyReferenceInput {
  const safeSource = source as Record<string, unknown> | undefined;
  const normalizedName = safeSource ? asSeedString(safeSource, ['name', 'company_name', 'company', 'title']) : null;
  const normalizedLogo = safeSource
    ? asSeedString(safeSource, ['logo', 'logoUrl', 'logo_url', 'image', 'imageUrl', 'image_url']) 
    : null;
  const normalizedWebsite = safeSource
    ? asSeedString(safeSource, ['website', 'websiteUrl', 'website_url', 'site', 'siteUrl', 'site_url'])
    : null;
  const normalizedDomain = safeSource
    ? asSeedString(safeSource, ['domain', 'domainName', 'company_domain', 'emailDomain'])
    : null;
  const normalizedIndustry = safeSource
    ? asSeedString(safeSource, ['industry', 'industry_name', 'sector'])
    : null;
  const normalizedDescription = safeSource
    ? asSeedString(safeSource, ['description', 'about', 'summary', 'details'])
    : null;
  const normalizedEmail = safeSource
    ? asSeedString(safeSource, ['email', 'contactEmail', 'contact_email', 'companyEmail', 'company_email'])
    : null;
  const normalizedPhone = safeSource
    ? asSeedString(safeSource, ['phone', 'phoneNumber', 'phone_number', 'contactPhone', 'contact_phone'])
    : null;
  const normalizedAddress = safeSource
    ? asSeedString(safeSource, ['address', 'full_address', 'companyAddress', 'company_address'])
    : null;
  const normalizedCountry = safeSource
    ? asSeedString(safeSource, ['country', 'country_name', 'countryName', 'region'])
    : null;
  const normalizedSortOrder = safeSource ? asSeedNumber(safeSource, ['sortOrder', 'sort_order', 'order']) : null;
  const isActive = safeSource ? asSeedBoolean(safeSource, ['isActive', 'is_active', 'active'], true) : true;

  return {
    name: normalizedName || 'Common Company',
    legalName: asSeedString(safeSource || {}, ['legalName', 'legal_name', 'registered_name', 'legalNameEnglish']) || normalizedName || 'Common Company',
    logo: normalizedLogo || null,
    website: normalizedWebsite || null,
    domain: normalizedDomain || null,
    industry: normalizedIndustry || null,
    description: normalizedDescription || 'Company reference data loaded from AppKit company_reference.',
    email: normalizedEmail || null,
    phone: normalizedPhone || null,
    address: normalizedAddress || null,
    country: normalizedCountry || null,
    metadata: {
      ...(source?.metadata || {}),
      appkitContentType: 'company_reference',
      environment,
      loadedAt: new Date().toISOString(),
    },
    source: 'appkit',
    externalId: asSeedString(safeSource || {}, ['__appkitId', 'externalId', 'external_id']) || null,
    appkitAppId: asSeedString(safeSource || {}, ['__appkitAppId', 'appkitAppId', 'appkit_app_id']) || null,
    sortOrder: normalizedSortOrder ?? 0,
    isActive,
  };
}

type AppKitCompanySeed = CompanyReferenceInput & {
    __appkitId?: string | null;
    __appkitAppId?: string | null;
    contactEmail?: string | null;
    logoUrl?: string | null;
  };

function buildCompanyReferenceParams(id: string, input: CompanyReferenceInput) {
  return [
    id,
    input.name,
    input.legalName || null,
    input.logo || null,
    input.website || null,
    input.domain || null,
    input.industry || null,
    input.description || null,
    input.email || null,
    input.phone || null,
    input.address || null,
    input.country || null,
    JSON.stringify(input.metadata || {}),
    input.source || 'manual',
    input.externalId || null,
    input.appkitAppId || null,
    input.sortOrder,
    input.isActive,
  ];
}
