import { randomUUID } from 'crypto';

import prisma from '../src/lib/prisma';

type Employee = {
  id: string;
  email: string;
  user_id: string | null;
};

async function insertOnce(
  table: string,
  whereSql: string,
  whereValues: unknown[],
  insertSql: string,
  insertValues: unknown[],
) {
  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "${table}" WHERE ${whereSql} LIMIT 1`,
    ...whereValues,
  );
  if (existing[0]) return existing[0].id;
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(insertSql, ...insertValues);
  return rows[0].id;
}

export async function seedPerformanceDemoData() {
  const currentYear = new Date().getUTCFullYear();
  const cycleName = `FY${currentYear} Growth & Impact`;
  const employees = await prisma.$queryRawUnsafe<Employee[]>(
    `SELECT id, email, user_id
     FROM "hr_employees"
     WHERE lower(email) IN (
       'nara.chan@example.com',
       'mika.stone@example.com',
       'ari.patel@example.com'
     )
     ORDER BY email`,
  );
  const nara = employees.find(employee => employee.email.toLowerCase() === 'nara.chan@example.com');
  const mika = employees.find(employee => employee.email.toLowerCase() === 'mika.stone@example.com');
  const ari = employees.find(employee => employee.email.toLowerCase() === 'ari.patel@example.com');
  if (!nara || !mika || !ari) {
    throw new Error('Run `npm run seed:hr` first so Nara, Mika, and Ari exist.');
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "hr_employees"
     SET manager_id = $1::uuid, updated_at = CURRENT_TIMESTAMP
     WHERE id IN ($2::uuid, $3::uuid)`,
    nara.id,
    mika.id,
    ari.id,
  );

  const cycleId = await insertOnce(
    'hr_performance_cycles',
    'name = $1',
    [cycleName],
    `INSERT INTO "hr_performance_cycles"
      (id, name, start_date, end_date, status, created_at, updated_at)
     VALUES ($1::uuid, $2, date_trunc('year', CURRENT_DATE)::date, (date_trunc('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::date, 'active',
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [randomUUID(), cycleName],
  );

  const reviewId = await insertOnce(
    'hr_performance_reviews',
    'cycle_id = $1::uuid AND employee_id = $2::uuid',
    [cycleId, mika.id],
    `INSERT INTO "hr_performance_reviews"
      (id, cycle_id, employee_id, reviewer_id, status, summary,
       competency_assessment, self_assessment, development_plan, version,
       created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'in_progress',
             'Strong stakeholder partnership with an opportunity to deepen workforce analytics.',
             $5::jsonb,
             'Led the recruiter enablement launch and reduced handoff delays across the hiring workflow.',
             'Build workforce analytics fluency through a dashboard project and monthly coaching.',
             1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      randomUUID(),
      cycleId,
      mika.id,
      nara.id,
      JSON.stringify({
        'Stakeholder partnership': { category: 'core', currentLevel: 4, expectedLevel: 4, employeeRating: 4, managerRating: 4 },
        'Workforce analytics': { category: 'functional', currentLevel: 2, expectedLevel: 3, employeeRating: 3, managerRating: 2 },
        'Coaching conversations': { category: 'leadership', currentLevel: 3, expectedLevel: 3, employeeRating: 3, managerRating: 3 },
      }),
    ],
  );

  await insertOnce(
    'hr_performance_goals',
    'employee_id = $1::uuid AND title = $2',
    [mika.id, 'Improve recruiter handoff quality'],
    `INSERT INTO "hr_performance_goals"
      (id, employee_id, review_id, title, description, status, progress,
       due_date, key_results, comments, evidence, approval_status, version,
       created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'in_progress', 72,
             (date_trunc('year', CURRENT_DATE) + INTERVAL '10 months - 1 day')::date, $6::jsonb, '[]'::jsonb, '[]'::jsonb,
             'approved', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      randomUUID(),
      mika.id,
      reviewId,
      'Improve recruiter handoff quality',
      'Create a consistent hiring-manager handoff and measure adoption.',
      JSON.stringify([
        { title: 'Publish the shared handoff checklist', completed: true },
        { title: 'Reach 85% adoption across open roles', completed: false },
      ]),
    ],
  );

  await insertOnce(
    'hr_performance_goals',
    'employee_id = $1::uuid AND title = $2',
    [mika.id, 'Build workforce analytics fluency'],
    `INSERT INTO "hr_performance_goals"
      (id, employee_id, review_id, title, description, status, progress,
       due_date, key_results, comments, evidence, approval_status, version,
       created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'in_progress', 45,
             (date_trunc('year', CURRENT_DATE) + INTERVAL '11 months - 1 day')::date, $6::jsonb, '[]'::jsonb, '[]'::jsonb,
             'approved', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      randomUUID(),
      mika.id,
      reviewId,
      'Build workforce analytics fluency',
      'Use funnel and quality-of-hire data to guide two quarterly decisions.',
      JSON.stringify([
        { title: 'Complete people analytics foundation course', completed: true },
        { title: 'Present a decision-ready dashboard', completed: false },
      ]),
    ],
  );

  const checkInId = await insertOnce(
    'hr_performance_check_ins',
    'employee_id = $1::uuid AND agenda = $2',
    [mika.id, 'Review Q3 outcomes, analytics development, and support for the hiring-manager rollout.'],
    `INSERT INTO "hr_performance_check_ins"
      (id, employee_id, manager_id, created_by_id, type, meeting_date, due_date,
       status, agenda, shared_notes, follow_up_items, attachments, version,
       created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'quarterly',
             CURRENT_TIMESTAMP + INTERVAL '7 days',
             CURRENT_TIMESTAMP + INTERVAL '7 days', 'scheduled', $5,
             'Bring the latest adoption data and two examples of manager feedback.',
             '[]'::jsonb, '[]'::jsonb, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      randomUUID(),
      mika.id,
      nara.id,
      nara.user_id,
      'Review Q3 outcomes, analytics development, and support for the hiring-manager rollout.',
    ],
  );

  await insertOnce(
    'hr_performance_feedback',
    'recipient_id = $1::uuid AND context = $2',
    [mika.id, 'Hiring-manager enablement launch'],
    `INSERT INTO "hr_performance_feedback"
      (id, recipient_id, provider_id, feedback_type, relationship, visibility,
       status, related_project, related_competency, context, went_well,
       improvement_suggestion, recommended_action, is_anonymous, attachments,
       created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 'manager', 'direct_manager',
             'recipient', 'published', 'Recruiter enablement',
             'Stakeholder partnership', $4, $5, $6, $7, FALSE, '[]'::jsonb,
             CURRENT_TIMESTAMP - INTERVAL '9 days',
             CURRENT_TIMESTAMP - INTERVAL '9 days')
     RETURNING id`,
    [
      randomUUID(),
      mika.id,
      nara.id,
      'Hiring-manager enablement launch',
      'You made the new handoff easy to adopt by listening early and turning concerns into a practical checklist.',
      'Bring the adoption data into the next update sooner so we can act before usage plateaus.',
      'Add a weekly adoption view and flag teams below 70%.',
    ],
  );

  await insertOnce(
    'hr_employee_recognition',
    'recipient_id = $1::uuid AND message = $2',
    [mika.id, 'Thank you for turning scattered manager feedback into a clear, usable handoff practice.'],
    `INSERT INTO "hr_employee_recognition"
      (id, recipient_id, provider_id, category, message, company_value,
       competency, related_project, visibility, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 'great_teamwork', $4, 'Work as one',
             'Stakeholder partnership', 'Recruiter enablement', 'recipient',
             CURRENT_TIMESTAMP - INTERVAL '5 days',
             CURRENT_TIMESTAMP - INTERVAL '5 days')
     RETURNING id`,
    [
      randomUUID(),
      mika.id,
      nara.id,
      'Thank you for turning scattered manager feedback into a clear, usable handoff practice.',
    ],
  );

  const planId = await insertOnce(
    'hr_development_plans',
    'employee_id = $1::uuid AND title = $2',
    [mika.id, 'Decision-ready workforce analytics'],
    `INSERT INTO "hr_development_plans"
      (id, employee_id, owner_manager_id, title, plan_type, status, aspiration,
       target_date, version, approved_at, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'skill_development',
             'in_progress', $5, (date_trunc('year', CURRENT_DATE) + INTERVAL '11 months - 1 day')::date, 1,
             CURRENT_TIMESTAMP - INTERVAL '30 days',
             CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      randomUUID(),
      mika.id,
      nara.id,
      'Decision-ready workforce analytics',
      'Confidently translate funnel data into a clear recommendation for hiring leaders.',
    ],
  );

  await insertOnce(
    'hr_development_actions',
    'plan_id = $1::uuid AND title = $2',
    [planId, 'Build the Q3 hiring health dashboard'],
    `INSERT INTO "hr_development_actions"
      (id, plan_id, title, description, action_type, related_competency,
       priority, status, progress, due_date, evidence, version,
       created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, 'stretch_assignment',
             'Workforce analytics', 'high', 'in_progress', 55,
             (date_trunc('year', CURRENT_DATE) + INTERVAL '9 months - 1 day')::date, '[]'::jsonb, 1,
             CURRENT_TIMESTAMP - INTERVAL '28 days', CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      randomUUID(),
      planId,
      'Build the Q3 hiring health dashboard',
      'Partner with Finance and Engineering to define a small decision-ready metric set.',
    ],
  );

  await insertOnce(
    'hr_competency_evidence',
    'employee_id = $1::uuid AND title = $2',
    [mika.id, 'Recruiter handoff adoption report'],
    `INSERT INTO "hr_competency_evidence"
      (id, employee_id, competency_name, evidence_type, title, description,
       status, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, 'Workforce analytics', 'project_achievement',
             $3, $4, 'submitted',
             CURRENT_TIMESTAMP - INTERVAL '3 days',
             CURRENT_TIMESTAMP - INTERVAL '3 days')
     RETURNING id`,
    [
      randomUUID(),
      mika.id,
      'Recruiter handoff adoption report',
      'Weekly adoption and quality indicators used to prioritize manager follow-up.',
    ],
  );

  await insertOnce(
    'hr_performance_activities',
    'entity_id = $1::uuid AND activity_type = $2',
    [checkInId, 'check_in_scheduled'],
    `INSERT INTO "hr_performance_activities"
      (id, employee_id, actor_user_id, activity_type, entity_type, entity_id,
       title, details, visibility, occurred_at, created_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 'check_in_scheduled',
             'performance_check_in', $4::uuid, 'Quarterly check-in scheduled',
             '{"source":"seed"}'::jsonb, 'employee',
             CURRENT_TIMESTAMP - INTERVAL '2 days',
             CURRENT_TIMESTAMP - INTERVAL '2 days')
     RETURNING id`,
    [randomUUID(), mika.id, nara.user_id, checkInId],
  );

  console.log('Performance workspace demo data is ready for Mika Stone and manager Nara Chan.');
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed-performance.ts')) seedPerformanceDemoData()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
