import { getPool, type DbClient } from './db';
import { OPTIONAL_RECRUITMENT_STAGE_NAMES } from './recruitment-stage-system-shared';

export {
  isRequiredRecruitmentStageName,
  isSystemRecruitmentStage,
  OPTIONAL_RECRUITMENT_STAGE_NAMES,
  REQUIRED_RECRUITMENT_STAGE_NAMES,
  type RecruitmentStageSystemFields,
} from './recruitment-stage-system-shared';

type RecruitmentStageQueryable = Pick<DbClient, 'query'>;

export async function ensureRequiredRecruitmentStages(queryable: RecruitmentStageQueryable = getPool()) {
  await queryable.query(
    `UPDATE "RecruitmentStage"
     SET is_system = false
     WHERE name = ANY($1::text[])
       AND is_system = true`,
    [OPTIONAL_RECRUITMENT_STAGE_NAMES]
  );

  await queryable.query(`
    INSERT INTO "RecruitmentStage" (
      id, name, description, is_system, sort_order, color_complete, color_badge
    ) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'Applied', 'Applicant has submitted their application', true, 1, '#60a5fa', '#60a5fa'),
      ('550e8400-e29b-41d4-a716-446655440008', 'Hired', 'Applicant has been hired and started employment', true, 8, '#22c55e', '#22c55e'),
      ('550e8400-e29b-41d4-a716-446655440009', 'Rejected', 'Applicant has been rejected from the process', true, 9, '#ef4444', '#ef4444')
    ON CONFLICT (name) DO UPDATE SET
      is_system = true
  `);
}
