import { randomUUID } from 'crypto';

import prisma from '../src/lib/prisma';

type Row = Record<string, unknown>;

const TEMPLATE_NAME = 'Balanced Contribution Review';
const RATING_MODEL_NAME = 'Five-Level Contribution Scale';
const CURRENT_YEAR = new Date().getUTCFullYear();
const ACTIVE_CYCLE_NAME = `${CURRENT_YEAR} Annual Contribution Review`;
const RELEASED_CYCLE_NAME = `${CURRENT_YEAR - 1} Annual Contribution Review`;

async function first<T extends Row>(sql: string, ...params: unknown[]) {
  const rows = await prisma.$queryRawUnsafe<T[]>(sql, ...params);
  return rows[0] || null;
}

async function seedTemplate() {
  let template = await first<Row>(
    `SELECT id, current_version AS "currentVersion" FROM "hr_appraisal_templates" WHERE name = $1 LIMIT 1`,
    TEMPLATE_NAME,
  );
  if (!template) {
    const templateId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "hr_appraisal_templates"
        (id, name, description, status, current_version, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, 'active', 1, NOW(), NOW())`,
      templateId,
      TEMPLATE_NAME,
      'A formal annual review balancing Goal results, demonstrated competencies, manager judgment, and development outcomes.',
    );
    const sections = [
      { key: 'context', title: 'Review context', type: 'information', required: false, weight: 0, visibleTo: ['self', 'manager', 'hr'], editableBy: ['hr'] },
      { key: 'goals', title: 'Goal achievement', type: 'goal', required: true, weight: 40, visibleTo: ['self', 'manager', 'hr'], editableBy: ['self', 'manager'] },
      { key: 'competencies', title: 'Competency assessment', type: 'competency', required: true, weight: 30, visibleTo: ['self', 'manager', 'peer', 'hr'], editableBy: ['self', 'manager', 'peer'] },
      { key: 'summary', title: 'Achievement summary', type: 'text', required: true, weight: 0, visibleTo: ['self', 'manager', 'hr'], editableBy: ['self', 'manager'] },
      { key: 'overall', title: 'Overall contribution', type: 'rating', required: true, weight: 30, visibleTo: ['manager', 'hr'], editableBy: ['manager', 'hr'] },
      { key: 'acknowledgment', title: 'Employee acknowledgment', type: 'acknowledgment', required: true, weight: 0, visibleTo: ['self', 'hr'], editableBy: ['self'] },
    ];
    await prisma.$executeRawUnsafe(
      `INSERT INTO "hr_appraisal_template_versions"
        (id, template_id, version, sections, calculation_config, visibility_config,
         status, published_at, created_at)
       VALUES ($1::uuid, $2::uuid, 1, $3::jsonb, $4::jsonb, $5::jsonb,
               'published', NOW(), NOW())`,
      randomUUID(),
      templateId,
      JSON.stringify(sections),
      JSON.stringify({ weights: { goals: 40, competencies: 30, manager: 30, peer: 0 }, missingBehavior: 'block' }),
      JSON.stringify({ finalRating: ['hr'], anonymousReviewerIdentity: ['hr_with_sensitive_permission'] }),
    );
    template = { id: templateId, currentVersion: 1 };
  }
  return first<Row>(
    `SELECT id FROM "hr_appraisal_template_versions" WHERE template_id = $1::uuid ORDER BY version DESC LIMIT 1`,
    template.id,
  );
}

async function seedRatingModel() {
  let model = await first<Row>(
    `SELECT id FROM "hr_appraisal_rating_models" WHERE name = $1 LIMIT 1`,
    RATING_MODEL_NAME,
  );
  if (!model) {
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "hr_appraisal_rating_models"
        (id, name, description, scale_type, minimum_score, maximum_score,
         rounding_decimals, missing_response_behavior, configuration, status,
         created_at, updated_at)
       VALUES ($1::uuid, $2, $3, 'descriptive', 0, 100, 1, 'block', $4::jsonb,
               'active', NOW(), NOW())`,
      id,
      RATING_MODEL_NAME,
      'A behavior-anchored scale used for formal contribution reviews.',
      JSON.stringify({ weights: { goals: 40, competencies: 30, manager: 30, peer: 0 }, missingBehavior: 'block' }),
    );
    const levels = [
      ['EX', 'Exceptional', 5, 90, 100, 'positive', 'Sustained, organization-level impact well beyond the role.'],
      ['EE', 'Exceeds expectations', 4, 80, 89.99, 'positive', 'Frequently delivers beyond role expectations with strong evidence.'],
      ['ME', 'Meets expectations', 3, 65, 79.99, 'neutral', 'Consistently delivers the expected outcomes and behaviors.'],
      ['PM', 'Partially meets expectations', 2, 50, 64.99, 'attention', 'Some expectations were met; focused support and follow-through are needed.'],
      ['DM', 'Does not meet expectations', 1, 0, 49.99, 'critical', 'Material role expectations were not met during the period.'],
    ];
    for (const [code, label, numeric, minimum, maximum, semantic, guidance] of levels) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "hr_appraisal_rating_levels"
          (id, rating_model_id, code, label, numeric_value, minimum_score,
           maximum_score, display_order, semantic_status, guidance)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10)`,
        randomUUID(), id, code, label, numeric, minimum, maximum, levels.indexOf(levels.find(item => item[0] === code)!), semantic, guidance,
      );
    }
    model = { id };
  }
  return model;
}

async function seedCycle(name: string, year: number, status: string, templateVersionId: unknown, ratingModelId: unknown) {
  let cycle = await first<Row>(`SELECT id, version FROM "hr_performance_cycles" WHERE name = $1 LIMIT 1`, name);
  if (!cycle) {
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "hr_performance_cycles"
        (id, name, description, review_type, start_date, end_date, self_due_date,
         manager_due_date, calibration_start_date, calibration_due_date,
         release_date, acknowledgment_due_date, population_config,
         workflow_config, configuration, template_version_id, rating_model_id,
         status, version, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, 'annual', $4::date, $5::date, $6::date,
               $7::date, $8::date, $9::date, $10::date, $11::date,
               $12::jsonb, $13::jsonb, $14::jsonb, $15::uuid, $16::uuid,
               $17, 1, NOW(), NOW())`,
      id,
      name,
      `${year} formal contribution review for active employees.`,
      `${year}-01-01`,
      `${year}-12-31`,
      `${year}-11-14`,
      `${year}-11-28`,
      `${year}-12-01`,
      `${year}-12-08`,
      `${year}-12-15`,
      `${year}-12-22`,
      JSON.stringify({ departmentIds: [], employeeIds: [], excludedEmployeeIds: [], employmentStatuses: ['active'] }),
      JSON.stringify({ sequential: true, steps: ['manager', 'calibration', 'final_hr'] }),
      JSON.stringify({ requirePeerReview: true, requireCalibration: true }),
      templateVersionId,
      ratingModelId,
      status,
    );
    cycle = { id, version: 1 };
  }
  return cycle;
}

async function seedReviews(cycle: Row, templateVersionId: unknown, ratingModelId: unknown, historical: boolean) {
  const employees = await prisma.$queryRawUnsafe<Array<{ id: string; managerId: string; userId: string | null; name: string }>>(
    `SELECT e.id, e.manager_id AS "managerId", e.user_id AS "userId",
            CONCAT_WS(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS name
       FROM "hr_employees" e
      WHERE e.status IN ('active', 'probation') AND e.manager_id IS NOT NULL
      ORDER BY e.employee_number LIMIT 12`,
  );
  const statuses = historical
    ? ['acknowledged', 'released', 'acknowledged', 'completed']
    : ['self_assessment_in_progress', 'awaiting_manager_review', 'manager_review_in_progress', 'awaiting_calibration', 'awaiting_final_approval', 'ready_for_release'];
  for (let index = 0; index < employees.length; index += 1) {
    const employee = employees[index];
    const existing = await first<Row>(
      `SELECT id FROM "hr_performance_reviews" WHERE cycle_id = $1::uuid AND employee_id = $2::uuid LIMIT 1`,
      cycle.id,
      employee.id,
    );
    if (existing) continue;
    const reviewId = randomUUID();
    const status = statuses[index % statuses.length];
    const selfSubmitted = historical || !['self_assessment_in_progress'].includes(status);
    const managerDrafted = historical || ['manager_review_in_progress', 'awaiting_calibration', 'awaiting_final_approval', 'ready_for_release'].includes(status);
    const calibrated = historical || ['awaiting_final_approval', 'ready_for_release'].includes(status);
    const released = historical;
    const baseRating = 68 + (index % 5) * 4.2;
    const managerRating = managerDrafted ? baseRating + 1.4 : null;
    const calibratedRating = calibrated ? baseRating + (index % 2 ? -0.8 : 0.6) : null;
    const finalRating = released ? calibratedRating || managerRating || baseRating : null;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "hr_performance_reviews"
        (id, cycle_id, employee_id, reviewer_id, status, template_version_id,
         rating_model_id, self_assessment, self_responses, manager_assessment,
         manager_comments, strengths, development_areas, career_aspiration,
         development_recommendation, calculated_rating, manager_rating,
         calibrated_rating, final_rating, rating, goal_result, competency_result,
         submitted_at, completed_at, released_at, acknowledgment_status,
         acknowledgment_comment, acknowledged_at, version, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6::uuid, $7::uuid,
               $8, $9::jsonb, $10, $11, $12, $13, $14, $15, $16, $17, $18,
               $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 1, NOW(), NOW())`,
      reviewId,
      cycle.id,
      employee.id,
      employee.managerId,
      status,
      templateVersionId,
      ratingModelId,
      selfSubmitted ? 'I delivered the committed operational improvements, supported cross-functional launches, and documented evidence against each approved Goal.' : 'I am consolidating evidence from the first three quarters and validating the final Goal outcomes.',
      JSON.stringify({ achievementSummary: selfSubmitted ? 'Submitted with evidence' : 'Draft in progress' }),
      managerDrafted ? 'The employee delivered dependable outcomes and showed stronger cross-functional ownership during the second half of the period.' : null,
      managerDrafted ? 'Performance evidence supports the proposed rating. The next development focus is leading work through others and communicating decisions earlier.' : null,
      managerDrafted ? 'Reliable delivery, practical problem solving, and constructive partnership.' : null,
      managerDrafted ? 'Broaden delegation and strengthen executive-level communication.' : null,
      selfSubmitted ? 'Build leadership breadth through a cross-department initiative.' : null,
      managerDrafted ? 'Assign a stretch initiative and a targeted leadership learning path.' : null,
      managerDrafted ? baseRating : null,
      managerRating,
      calibratedRating,
      finalRating,
      finalRating,
      managerDrafted ? baseRating + 2 : null,
      managerDrafted ? baseRating - 1 : null,
      selfSubmitted ? new Date() : null,
      released ? new Date() : null,
      released ? new Date() : null,
      released ? (index % 2 ? 'acknowledgment_pending' : 'acknowledged') : 'not_released',
      released && index % 2 === 0 ? 'I acknowledge receipt and discussed the development priorities with my manager.' : null,
      released && index % 2 === 0 ? new Date() : null,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "hr_appraisal_reviewers"
        (id, review_id, reviewer_id, reviewer_role, is_required, weight, due_date,
         status, rating, strengths, development_areas, submitted_at, version,
         created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, 'manager', TRUE, 100, NOW() + INTERVAL '30 days',
               $4, $5, $6, $7, $8, 1, NOW(), NOW())`,
      randomUUID(),
      reviewId,
      employee.managerId,
      managerDrafted ? 'submitted' : 'not_started',
      managerRating,
      managerDrafted ? 'Consistent ownership and delivery quality.' : null,
      managerDrafted ? 'Build more leverage through delegation.' : null,
      managerDrafted ? new Date() : null,
    );
    const peer = employees.find(candidate => candidate.id !== employee.id && candidate.id !== employee.managerId);
    if (peer) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "hr_appraisal_reviewers"
          (id, review_id, reviewer_id, reviewer_role, is_required, is_anonymous,
           weight, due_date, status, rating, strengths, development_areas,
           submitted_at, version, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, 'peer', TRUE, TRUE, 0,
                 NOW() + INTERVAL '21 days', $4, $5, $6, $7, $8, 1, NOW(), NOW())`,
        randomUUID(),
        reviewId,
        peer.id,
        managerDrafted ? 'submitted' : 'not_started',
        managerDrafted ? baseRating - 0.5 : null,
        managerDrafted ? 'Creates clarity during cross-functional delivery.' : null,
        managerDrafted ? 'Share context earlier when priorities change.' : null,
        managerDrafted ? new Date() : null,
      );
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO "hr_appraisal_approvals"
        (id, review_id, approval_role, sequence, approver_id, status, decision,
         comment, previous_status, new_status, decided_at, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, 'manager', 1, $3::uuid, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      randomUUID(),
      reviewId,
      employee.managerId,
      managerDrafted ? 'approved' : 'pending',
      managerDrafted ? 'approved' : null,
      managerDrafted ? 'Evidence reviewed and rating proposal submitted.' : null,
      selfSubmitted ? 'awaiting_manager_review' : 'awaiting_employee_submission',
      managerDrafted ? 'awaiting_calibration' : null,
      managerDrafted ? new Date() : null,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "hr_appraisal_events"
        (id, cycle_id, review_id, event_type, new_value, metadata, created_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, 'appraisal_record_generated',
               $4::jsonb, $5::jsonb, NOW())`,
      randomUUID(),
      cycle.id,
      reviewId,
      JSON.stringify({ employee: employee.name, status }),
      JSON.stringify({ source: 'realistic_appraisal_seed' }),
    );
  }
}

export async function seedAppraisalDemoData() {
  const templateVersion = await seedTemplate();
  const ratingModel = await seedRatingModel();
  if (!templateVersion || !ratingModel) throw new Error('Unable to seed appraisal configuration.');
  const active = await seedCycle(ACTIVE_CYCLE_NAME, CURRENT_YEAR, 'self_assessment', templateVersion.id, ratingModel.id);
  const historical = await seedCycle(RELEASED_CYCLE_NAME, CURRENT_YEAR - 1, 'released', templateVersion.id, ratingModel.id);
  await seedReviews(active, templateVersion.id, ratingModel.id, false);
  await seedReviews(historical, templateVersion.id, ratingModel.id, true);
  console.log('Appraisal seed completed:', {
    template: TEMPLATE_NAME,
    ratingModel: RATING_MODEL_NAME,
    cycles: [ACTIVE_CYCLE_NAME, RELEASED_CYCLE_NAME],
  });
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed-appraisal.ts')) seedAppraisalDemoData()
  .catch(error => {
    console.error('Appraisal seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
