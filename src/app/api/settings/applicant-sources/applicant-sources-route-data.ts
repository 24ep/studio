import { v4 as uuidv4 } from 'uuid';

import { fetchAppKitSeedCollection } from '@/lib/appkit-sdk-client';
import { getPool } from '@/lib/db';
import type {
  AppKitApplicantSourcesImportInput,
  ApplicantSourceIdRow,
  ApplicantSourceRow,
  CreateApplicantSourceInput,
} from './applicant-sources-route-schema';

export async function fetchApplicantSources() {
  const result = await getPool().query<ApplicantSourceRow>(`
    SELECT 
      id, name, description, email, logo, allow_sub_source as "allowSubSource", 
      sort_order as "sortOrder", is_active as "isActive", 
      "createdAt", "updatedAt"
    FROM "ApplicantSource"
    ORDER BY sort_order ASC, name ASC
  `);

  return result.rows;
}

export async function applicantSourceNameExists(name: string) {
  const existingResult = await getPool().query<ApplicantSourceIdRow>(
    'SELECT id FROM "ApplicantSource" WHERE name = $1',
    [name]
  );

  return existingResult.rows.length > 0;
}

export async function createApplicantSource(input: CreateApplicantSourceInput) {
  const id = uuidv4();
  const result = await getPool().query<ApplicantSourceRow>(`
    INSERT INTO "ApplicantSource" (
      id, name, description, email, logo, allow_sub_source, sort_order, is_active, 
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING id, name, description, email, logo, allow_sub_source as "allowSubSource", 
              sort_order as "sortOrder", is_active as "isActive", 
              "createdAt", "updatedAt"
  `, [
    id,
    input.name,
    input.description,
    input.email,
    input.logo,
    input.allowSubSource,
    input.sortOrder,
    input.isActive,
  ]);

  return result.rows[0];
}

export async function importApplicantSourcesFromAppKit(input: AppKitApplicantSourcesImportInput) {
  const productionSources: CreateApplicantSourceInput[] = [
    {
      name: 'Company Website',
      description: 'Candidates who apply through the company career site.',
      email: null,
      logo: null,
      allowSubSource: false,
      sortOrder: 0,
      isActive: true,
    },
    {
      name: 'LinkedIn',
      description: 'Candidates sourced or applying from LinkedIn.',
      email: null,
      logo: null,
      allowSubSource: true,
      sortOrder: 1,
      isActive: true,
    },
    source('JobsDB', 'Candidates sourced through JobsDB Thailand by SEEK.', 2),
    source('JobThai', 'Candidates sourced through JobThai.', 3),
    source('JOBTOPGUN', 'Candidates sourced through JOBTOPGUN Thailand.', 4),
    source('JOBBKK', 'Candidates sourced through JOBBKK.', 5),
    source('JobTH', 'Candidates sourced through JobTH.', 6),
    source('ThaiJob', 'Candidates sourced through ThaiJob.', 7),
    source('WorkVenture', 'Candidates sourced through WorkVenture Thailand.', 8),
    source('Indeed', 'Candidates sourced through Indeed Thailand.', 9),
    source('ไทยมีงานทำ (DOE)', "Candidates sourced through the Thai Department of Employment's ไทยมีงานทำ service.", 10),
    source('InternTH', 'Interns, cooperative-education students, fresh graduates, and applicants sourced through InternTH.', 11),
    source('ThaiHotelJob', 'Hospitality candidates sourced through ThaiHotelJob.', 12),
    source('Facebook', 'Candidates sourced through Facebook pages, groups, posts, or advertising campaigns.', 13),
    source('LINE', 'Candidates sourced through LINE official accounts, groups, chats, or campaigns.', 14),
    source('Instagram', 'Candidates sourced through Instagram content, messages, or campaigns.', 15),
    source('TikTok', 'Candidates sourced through TikTok content, messages, or campaigns.', 16),
    source('Employee Referral', 'Candidates referred by an employee.', 17),
    source('Recruitment Agency / Headhunter', 'Candidates introduced by a recruitment agency, staffing firm, or executive-search partner.', 18),
    source('University / Campus Recruitment', 'Candidates sourced through universities, colleges, campus events, or career centers.', 19),
    source('Internship / Cooperative Education', 'Candidates entering through an internship or cooperative-education program.', 20),
    source('Job Fair / Job Expo', 'Candidates sourced through an in-person or virtual job fair, career fair, or job expo.', 21),
    source('Walk-in', 'Candidates who applied in person at a company location.', 22, false),
    source('Email / Direct Application', 'Candidates who applied directly by email or another direct contact channel.', 23, false),
    source('Internal Transfer', 'Existing employees applying or moving through an internal transfer.', 24, false),
    source('Internal Promotion', 'Existing employees considered through an internal promotion.', 25, false),
    source('Talent Pool / Previous Applicant', 'Candidates re-engaged from the talent pool or an earlier application.', 26),
    source('Professional Association / Community', 'Candidates sourced through professional associations, trade groups, or specialist communities.', 27),
    source('Other', 'Any applicant source not covered by the standard catalog.', 28),
  ];
  const appKitSources = await fetchAppKitSeedCollection<CreateApplicantSourceInput>(input.environment, 'applicant_sources');
  const sources = appKitSources.length > 0
    ? appKitSources.map(normalizeApplicantSourceSeed).filter((source) => source.name)
    : productionSources;
  const imported: ApplicantSourceRow[] = [];

  for (const source of sources) {
    const result = await getPool().query<ApplicantSourceRow>(`
      INSERT INTO "ApplicantSource" (
        id, name, description, email, logo, allow_sub_source, sort_order, is_active,
        "createdAt", "updatedAt"
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        email = EXCLUDED.email,
        logo = EXCLUDED.logo,
        allow_sub_source = EXCLUDED.allow_sub_source,
        sort_order = EXCLUDED.sort_order,
        is_active = EXCLUDED.is_active,
        "updatedAt" = NOW()
      RETURNING id, name, description, email, logo, allow_sub_source as "allowSubSource",
                sort_order as "sortOrder", is_active as "isActive",
                "createdAt", "updatedAt"
    `, [
      source.name,
      source.description,
      source.email,
      source.logo,
      source.allowSubSource,
      source.sortOrder,
      source.isActive,
    ]);

    if (result.rows[0]) {
      imported.push(result.rows[0]);
    }
  }

  return imported;
}

function source(
  name: string,
  description: string,
  sortOrder: number,
  allowSubSource = true,
): CreateApplicantSourceInput {
  return {
    name,
    description,
    email: null,
    logo: null,
    allowSubSource,
    sortOrder,
    isActive: true,
  };
}

function normalizeApplicantSourceSeed(source: CreateApplicantSourceInput, index: number): CreateApplicantSourceInput {
  return {
    name: String(source.name || '').trim(),
    description: source.description ? String(source.description) : null,
    email: source.email ? String(source.email) : null,
    logo: source.logo ? String(source.logo) : null,
    allowSubSource: Boolean(source.allowSubSource),
    sortOrder: Number.isFinite(Number(source.sortOrder)) ? Number(source.sortOrder) : index,
    isActive: source.isActive !== false,
  };
}
