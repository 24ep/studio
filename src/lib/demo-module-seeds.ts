import prisma from '@/lib/prisma';
import { createHash, randomUUID } from 'crypto';
import { createDefaultCompanyPortalState } from '@/lib/company-portal-builder';

export type DemoModuleSeedSummary = Record<string, number>;

export async function seedAllDemoModules(adminUserId: string): Promise<DemoModuleSeedSummary> {
  const employees = await prisma.employee.findMany({
    where: { email: { endsWith: '@demo.hrive.local' } },
    orderBy: { employeeNumber: 'asc' },
    take: 40,
    select: { id: true, firstName: true, lastName: true, email: true, departmentId: true },
  });
  if (!employees.length) throw new Error('Demo employees must be initialized before module data.');

  const stages = await seedRecruitment(adminUserId);
  const learning = await seedLearning(employees);
  const surveys = await seedSurvey(adminUserId, employees);
  const operations = await seedOperationalModules(adminUserId, employees);
  const support = await seedServiceDesk(adminUserId, employees[0].id);
  const platform = await seedPlatformModules(adminUserId);

  return { recruitment: stages, learning, surveys, operations, support, platform };
}

async function seedRecruitment(adminUserId: string) {
  const stageDefinitions = [
    ['Applied', 10, '#dbeafe'], ['Screening', 20, '#fef3c7'], ['Interview', 30, '#ede9fe'],
    ['Offer', 40, '#dcfce7'], ['Hired', 50, '#bbf7d0'], ['Rejected', 60, '#fee2e2'],
  ] as const;
  for (const [name, sortOrder, color] of stageDefinitions) {
    await prisma.recruitmentStage.upsert({
      where: { name }, update: {},
      create: { name, description: `${name} stage for the demo hiring pipeline`, isSystem: true, sortOrder, color_badge: color },
    });
  }
  const source = await prisma.applicantSource.upsert({
    where: { name: 'Demo careers site' }, update: {},
    create: { name: 'Demo careers site', description: 'Synthetic candidates from the public careers experience', sortOrder: 10 },
  });
  const departments = ['Engineering', 'Sales', 'People & Culture', 'Customer Success'];
  const titles = ['Senior Software Engineer', 'Account Executive', 'People Operations Partner', 'Customer Success Manager'];
  const positions = [];
  for (let index = 0; index < titles.length; index += 1) {
    let position = await prisma.position.findFirst({ where: { title: titles[index], department: departments[index] } });
    position ??= await prisma.position.create({ data: {
      title: titles[index], department: departments[index], isOpen: index < 3, recruiterId: adminUserId,
      positionLevel: index === 0 ? 'Senior' : 'Mid', description: `Demo opening for ${titles[index]}.`,
      matchCriteria: 'Relevant experience, collaboration, communication, and measurable impact.',
    } });
    positions.push(position);
  }
  const stageRows = await prisma.recruitmentStage.findMany({ orderBy: { sortOrder: 'asc' } });
  const candidateNames = ['Riya Patel', 'Minh Nguyen', 'Sofia Garcia', 'Daniel Kim', 'Ploy Anan', 'Theo Santos', 'Lina Chen', 'Sam Lee', 'Arun Tan', 'Maya Stone', 'Niran Wong', 'Kanya Lim'];
  for (let index = 0; index < candidateNames.length; index += 1) {
    const email = `candidate.${String(index + 1).padStart(2, '0')}@demo.hrive.local`;
    if (await prisma.applicant.findFirst({ where: { email } })) continue;
    await prisma.applicant.create({ data: {
      name: candidateNames[index], email, phone: `+66 89 200 ${String(index + 1).padStart(4, '0')}`,
      positionId: positions[index % positions.length].id, recruiterId: adminUserId, sourceId: source.id,
      statusId: stageRows[index % Math.min(5, stageRows.length)].id, fitScore: 64 + ((index * 7) % 32),
      applicationDate: new Date(Date.now() - index * 5 * 86_400_000), expectedSalary: 55_000 + index * 3_500,
      parsedData: { demo: true, summary: 'Synthetic candidate profile', skills: ['Communication', 'Domain expertise'] },
      educationData: [{ institution: 'Demo University', degree: 'Bachelor degree' }],
      experienceData: [{ company: 'Example Company', years: 3 + (index % 6) }],
    } });
  }
  const applicants = await prisma.applicant.findMany({ where: { email: { endsWith: '@demo.hrive.local' } } });
  for (const applicant of applicants.slice(0, 4)) {
    const content = 'Strong example profile for team calibration.';
    if (!await prisma.applicantComment.findFirst({ where: { applicantId: applicant.id, authorId: adminUserId, content } })) {
      await prisma.applicantComment.create({ data: { applicantId: applicant.id, authorId: adminUserId, content, type: 'remark' } });
    }
  }
  return applicants.length + positions.length;
}

async function seedLearning(employees: Array<{ id: string }>) {
  const definitions = [
    ['Welcome to Hrive Demo Co.', 'Onboarding', true],
    ['Manager Essentials', 'Leadership', false],
    ['Information Security & Privacy', 'Compliance', true],
    ['Inclusive Interviewing', 'Recruitment', false],
  ] as const;
  const courses = [];
  const courseContent = new Map<string, { versionId: string; lessonId: string; blockIds: string[] }>();
  for (const [title, category, isRequired] of definitions) {
    let course = await prisma.learningCourse.findFirst({ where: { title } });
    course ??= await prisma.learningCourse.create({ data: {
      title, category, isRequired, status: 'published', durationHours: isRequired ? 1.5 : 2,
      description: `Practical ${category.toLowerCase()} course with example progress.`, ownerName: 'People Development',
      objectives: ['Understand the core workflow', 'Apply the policy in a realistic scenario'],
    } });
    courses.push(course);
    let version = await prisma.learningCourseVersion.findUnique({ where: { courseId_version: { courseId: course.id, version: 1 } } });
    version ??= await prisma.learningCourseVersion.create({ data: { courseId: course.id, version: 1, status: 'published', rules: { completion: 'all_required_blocks' }, publishedAt: new Date() } });
    let section = await prisma.learningCourseSection.findFirst({ where: { versionId: version.id, title: 'Core lesson' } });
    section ??= await prisma.learningCourseSection.create({ data: { versionId: version.id, title: 'Core lesson', position: 1 } });
    let lesson = await prisma.learningLesson.findFirst({ where: { sectionId: section.id, title: `${title}: essentials` } });
    lesson ??= await prisma.learningLesson.create({ data: { sectionId: section.id, title: `${title}: essentials`, description: `A practical walkthrough of ${category.toLowerCase()} expectations.`, position: 1, estimatedMinutes: 15, minimumActiveSeconds: 180 } });
    const blocks = [];
    for (const block of [
      { type: 'rich_text', title: 'What you need to know', position: 1, content: { markdown: `This synthetic lesson introduces the core ${category.toLowerCase()} workflow and the decisions employees make.` } },
      { type: 'quiz', title: 'Knowledge check', position: 2, content: { question: 'What should you do when unsure?', options: ['Follow the documented workflow', 'Share confidential data', 'Skip the requirement'], correctIndex: 0 } },
    ]) {
      let row = await prisma.learningContentBlock.findFirst({ where: { lessonId: lesson.id, position: block.position } });
      row ??= await prisma.learningContentBlock.create({ data: { lessonId: lesson.id, ...block } });
      blocks.push(row.id);
    }
    await prisma.learningCourse.update({ where: { id: course.id }, data: { currentVersionId: version.id } });
    courseContent.set(course.id, { versionId: version.id, lessonId: lesson.id, blockIds: blocks });
  }
  for (let index = 0; index < Math.min(30, employees.length); index += 1) {
    const course = courses[index % courses.length];
    const progress = (index * 17) % 101;
    const content = courseContent.get(course.id)!;
    const enrollment = await prisma.learningEnrollment.upsert({
      where: { employeeId_courseId: { employeeId: employees[index].id, courseId: course.id } },
      update: { courseVersionId: content.versionId, currentLessonId: content.lessonId }, create: {
        employeeId: employees[index].id, courseId: course.id,
        status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'assigned', progress,
        dueDate: new Date(Date.now() + (10 + index) * 86_400_000),
        startedAt: progress > 0 ? new Date(Date.now() - index * 86_400_000) : null,
        completedAt: progress === 100 ? new Date() : null, activeSeconds: progress * 45,
        courseVersionId: content.versionId, currentLessonId: content.lessonId,
      },
    });
    await prisma.learningLessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: content.lessonId } },
      update: {}, create: {
        enrollmentId: enrollment.id, lessonId: content.lessonId,
        status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'available',
        activeSeconds: progress * 45, furthestSecond: progress * 6,
        completedBlocks: progress === 100 ? content.blockIds : progress > 50 ? content.blockIds.slice(0, 1) : [],
        score: progress === 100 ? 90 : null, completedAt: progress === 100 ? new Date() : null,
      },
    });
  }
  return courses.length * 6 + Math.min(30, employees.length) * 2;
}

async function seedSurvey(adminUserId: string, employees: Array<{ id: string; firstName: string; lastName: string; departmentId: string | null }>) {
  let survey = await prisma.survey.findFirst({ where: { internalName: 'demo-quarterly-engagement' } });
  survey ??= await prisma.survey.create({ data: {
    title: 'Quarterly Employee Experience Pulse', internalName: 'demo-quarterly-engagement',
    description: 'Synthetic engagement survey showing participation and result workflows.',
    type: 'engagement', status: 'published', privacyMode: 'anonymous', ownerUserId: adminUserId,
    estimatedMinutes: 4, isRequired: false, anonymousThreshold: 5, resultsVisibility: 'owner_live',
    opensAt: new Date(Date.now() - 14 * 86_400_000), closesAt: new Date(Date.now() + 7 * 86_400_000), publishedAt: new Date(),
  } });
  let section = await prisma.surveySection.findFirst({ where: { surveyId: survey.id, title: 'Your experience' } });
  section ??= await prisma.surveySection.create({ data: { surveyId: survey.id, title: 'Your experience', sortOrder: 1 } });
  const questionDefinitions = [
    ['I would recommend this company as a great place to work.', 'engagement'],
    ['I have the tools and support needed to do my best work.', 'enablement'],
    ['My manager gives me useful feedback.', 'leadership'],
  ] as const;
  for (let index = 0; index < questionDefinitions.length; index += 1) {
    const [text, dimension] = questionDefinitions[index];
    if (!await prisma.surveyQuestion.findFirst({ where: { surveyId: survey.id, text } })) {
      await prisma.surveyQuestion.create({ data: { surveyId: survey.id, sectionId: section.id, type: 'rating', text, dimension, isRequired: true, sortOrder: index + 1, config: { min: 1, max: 5 } } });
    }
  }
  for (let index = 0; index < Math.min(25, employees.length); index += 1) {
    const employee = employees[index];
    await prisma.surveyAudienceSnapshot.upsert({
      where: { surveyId_employeeId: { surveyId: survey.id, employeeId: employee.id } }, update: {},
      create: { surveyId: survey.id, employeeId: employee.id, included: true, reason: 'Demo workforce sample', employeeSnapshot: { name: `${employee.firstName} ${employee.lastName}`, departmentId: employee.departmentId } },
    });
    await prisma.surveyParticipation.upsert({
      where: { surveyId_employeeId: { surveyId: survey.id, employeeId: employee.id } }, update: {},
      create: { surveyId: survey.id, employeeId: employee.id, status: index < 17 ? 'completed' : index < 21 ? 'in_progress' : 'not_started', startedAt: index < 21 ? new Date(Date.now() - index * 3_600_000) : null, completedAt: index < 17 ? new Date(Date.now() - index * 1_800_000) : null },
    });
    if (index < 17) {
      const referenceCode = `DEMO-SURVEY-${String(index + 1).padStart(3, '0')}`;
      const accessTokenHash = createHash('sha256').update(`hrive:${survey.id}:${referenceCode}`).digest('hex');
      const response = await prisma.surveyResponse.upsert({
        where: { referenceCode }, update: {}, create: {
          surveyId: survey.id, privacyMode: 'anonymous', respondentEmployeeId: null,
          accessTokenHash, status: 'submitted', submittedAt: new Date(Date.now() - index * 1_800_000),
          durationSeconds: 150 + index * 7, referenceCode,
        },
      });
      const questions = await prisma.surveyQuestion.findMany({ where: { surveyId: survey.id }, orderBy: { sortOrder: 'asc' } });
      for (let questionIndex = 0; questionIndex < questions.length; questionIndex += 1) {
        await prisma.surveyResponseAnswer.upsert({
          where: { responseId_questionId: { responseId: response.id, questionId: questions[questionIndex].id } },
          update: {}, create: { responseId: response.id, questionId: questions[questionIndex].id, value: 3 + ((index + questionIndex) % 3) },
        });
      }
    }
  }
  return 1 + Math.min(25, employees.length) + Math.min(17, employees.length) * 4;
}

async function seedOperationalModules(adminUserId: string, employees: Array<{ id: string; departmentId: string | null }>) {
  for (const holiday of [
    { name: 'Demo Company Foundation Day', holidayDate: new Date(new Date().getFullYear(), 8, 12), location: 'All locations', isPaid: true },
    { name: 'Bangkok Team Day', holidayDate: new Date(new Date().getFullYear(), 10, 7), location: 'Bangkok', isPaid: true },
  ]) {
    if (!await prisma.holiday.findFirst({ where: { name: holiday.name, holidayDate: holiday.holidayDate } })) await prisma.holiday.create({ data: holiday });
  }
  await prisma.$executeRawUnsafe(`
    INSERT INTO expense_categories (id, code, name, requires_receipt, sort_order)
    VALUES (gen_random_uuid(), 'DEMO-TRAVEL', 'Business travel', true, 10), (gen_random_uuid(), 'DEMO-MEALS', 'Team meals', true, 20)
    ON CONFLICT (code) DO NOTHING;
    INSERT INTO expense_claims (id, reference, employee_id, title, business_purpose, period_start, period_end, department_id, claim_currency, reimbursement_currency, claimed_amount, eligible_amount, approved_amount, employee_reimbursement, payment_method, status, payment_status, policy_results, idempotency_key)
    SELECT gen_random_uuid(), 'DEMO-EXP-0001', $1::uuid, 'Customer workshop travel', 'On-site quarterly planning workshop', CURRENT_DATE - 12, CURRENT_DATE - 10, $2::uuid, 'THB', 'THB', 8450, 8450, 8450, 8450, 'bank_transfer', 'approved', 'ready', '[]'::jsonb, 'demo-expense-0001'
    ON CONFLICT (reference) DO NOTHING;
    INSERT INTO expense_claim_items (id, claim_id, category_id, expense_date, merchant, description, original_amount, original_currency, exchange_rate, converted_amount, approved_amount, business_purpose, review_status, receipt_number)
    SELECT gen_random_uuid(), c.id, category.id, CURRENT_DATE - 11, 'Demo Airways', 'Return flight for customer workshop', 6450, 'THB', 1, 6450, 6450, 'Customer quarterly planning', 'approved', 'DEMO-RCPT-0001'
    FROM expense_claims c JOIN expense_categories category ON category.code = 'DEMO-TRAVEL'
    WHERE c.reference = 'DEMO-EXP-0001' AND NOT EXISTS (SELECT 1 FROM expense_claim_items i WHERE i.claim_id = c.id AND i.receipt_number = 'DEMO-RCPT-0001');
    INSERT INTO expense_receipts (id, claim_id, claim_item_id, file_name, storage_path, mime_type, size_bytes, sha256_hash, ocr_status, ocr_values, employee_confirmed_ocr, uploaded_by_user_id)
    SELECT gen_random_uuid(), c.id, i.id, 'demo-airways-receipt.txt', 'demo://expense/DEMO-RCPT-0001', 'text/plain', 120, encode(digest('DEMO-RCPT-0001', 'sha256'), 'hex'), 'completed', '{"merchant":"Demo Airways","amount":6450,"currency":"THB"}'::jsonb, true, $3::uuid
    FROM expense_claims c JOIN expense_claim_items i ON i.claim_id = c.id
    WHERE c.reference = 'DEMO-EXP-0001' AND i.receipt_number = 'DEMO-RCPT-0001' AND NOT EXISTS (SELECT 1 FROM expense_receipts r WHERE r.storage_path = 'demo://expense/DEMO-RCPT-0001');
    INSERT INTO expense_approvals (id, entity_type, entity_id, sequence, approval_role, approver_user_id, status, decision, comment, acted_at)
    SELECT gen_random_uuid(), 'claim', c.id, 1, 'manager', $3::uuid, 'approved', 'approve', 'Synthetic approval for workflow training', NOW() - INTERVAL '1 day'
    FROM expense_claims c WHERE c.reference = 'DEMO-EXP-0001' ON CONFLICT (entity_type, entity_id, sequence, approval_role) DO NOTHING;
    INSERT INTO expense_activities (id, entity_type, entity_id, actor_user_id, action, from_status, to_status, comment, metadata, idempotency_key)
    SELECT gen_random_uuid(), 'claim', c.id, $3::uuid, 'approved', 'submitted', 'approved', 'Synthetic claim approved', '{"demo":true}'::jsonb, 'demo-expense-approved-0001'
    FROM expense_claims c WHERE c.reference = 'DEMO-EXP-0001' ON CONFLICT (idempotency_key) DO NOTHING;
    INSERT INTO hr_assets (id, asset_tag, asset_type, name, serial_number, status, purchase_date, value, currency, metadata)
    SELECT gen_random_uuid(), seed.asset_tag, seed.asset_type, seed.name, seed.serial_number, seed.status, seed.purchase_date, seed.value, 'THB', '{"demo":true}'::jsonb
    FROM (VALUES
      ('DEMO-LAP-0001', 'laptop', 'MacBook Pro 14', 'DEMO-SN-1001', 'assigned', CURRENT_DATE - 300, 74900),
      ('DEMO-PHN-0001', 'phone', 'Company mobile phone', 'DEMO-SN-1002', 'available', CURRENT_DATE - 180, 28900)
    ) seed(asset_tag, asset_type, name, serial_number, status, purchase_date, value)
    WHERE NOT EXISTS (SELECT 1 FROM hr_assets existing WHERE existing.asset_tag = seed.asset_tag);
    INSERT INTO hr_asset_assignments (id, asset_id, employee_id, acknowledged_at, status, assigned_by_id, notes)
    SELECT gen_random_uuid(), a.id, $1::uuid, NOW() - INTERVAL '100 days', 'assigned', $3::uuid, 'Synthetic asset assignment'
    FROM hr_assets a WHERE a.asset_tag = 'DEMO-LAP-0001' AND NOT EXISTS (SELECT 1 FROM hr_asset_assignments x WHERE x.asset_id = a.id AND x.status = 'assigned');
    INSERT INTO hr_cases (id, employee_id, case_number, case_type, title, description, status, priority, owner_user_id, due_at, created_by_id)
    SELECT gen_random_uuid(), $1::uuid, 'DEMO-CASE-0001', 'employee_relations', 'Flexible work arrangement review', 'Example confidential HR case for workflow training.', 'open', 'normal', $3::uuid, NOW() + INTERVAL '7 days', $3::uuid
    WHERE NOT EXISTS (SELECT 1 FROM hr_cases WHERE case_number = 'DEMO-CASE-0001');
    INSERT INTO hr_exit_cases (id, employee_id, exit_type, status, notice_date, last_working_date, reason, rehire_eligible, checklist, requested_by_id)
    SELECT gen_random_uuid(), $4::uuid, 'resignation', 'in_progress', CURRENT_DATE - 7, CURRENT_DATE + 23, 'Synthetic voluntary departure', true, '[{"title":"Knowledge transfer","status":"in_progress"},{"title":"Return assets","status":"pending"}]'::jsonb, $3::uuid
    WHERE NOT EXISTS (SELECT 1 FROM hr_exit_cases WHERE employee_id = $4::uuid AND status = 'in_progress');
    INSERT INTO hr_transportation_assignments (id, employee_id, mode, route, pickup_point, pickup_time, vehicle, status, created_by_id)
    VALUES (gen_random_uuid(), $5::uuid, 'company_shuttle', 'BKK-North-01', 'Central Ladprao', '07:30', 'Van 12', 'active', $3::uuid)
    ON CONFLICT (employee_id) DO NOTHING
  `, employees[0].id, employees[0].departmentId, adminUserId, employees[1].id, employees[2].id);
  for (const notification of [
    { userId: adminUserId, type: 'demo_setup', title: 'Demo workspace ready', message: 'Explore connected example workflows across every module.', data: { demo: true } },
    { userId: adminUserId, type: 'approval', title: 'Payroll run awaiting review', message: 'A synthetic payroll run is ready for approval.', data: { demo: true, href: '/payroll' } },
    { userId: adminUserId, type: 'recruitment', title: 'New candidate needs review', message: 'A high-fit demo candidate entered screening.', data: { demo: true, href: '/applicants' } },
  ]) {
    if (!await prisma.notification.findFirst({ where: { userId: adminUserId, type: notification.type, title: notification.title } })) await prisma.notification.create({ data: notification });
  }
  return 10;
}

async function seedServiceDesk(adminUserId: string, employeeId: string) {
  let category = await prisma.serviceDeskCategory.findFirst({ where: { key: 'demo-pay-benefits' } });
  category ??= await prisma.serviceDeskCategory.create({ data: { key: 'demo-pay-benefits', label: 'Pay & benefits', aiEnabled: true, sortOrder: 10, systemPrompt: 'Answer only from approved HR policy content.' } });
  await prisma.serviceDeskCategoryAssignee.upsert({ where: { categoryId_userId: { categoryId: category.id, userId: adminUserId } }, update: {}, create: { categoryId: category.id, userId: adminUserId } });
  const request = await prisma.employeeSupportRequest.upsert({
    where: { requestNumber: 'DEMO-SR-0001' }, update: {}, create: {
      requestNumber: 'DEMO-SR-0001', requesterUserId: adminUserId, employeeId, assignedToUserId: adminUserId,
      category: category.key, subject: 'How does the wellbeing allowance work?',
      description: 'Example employee question showing the service desk workflow.', status: 'in_progress', priority: 'normal', metadata: { demo: true },
    },
  });
  if (!await prisma.employeeSupportActivity.findFirst({ where: { requestId: request.id, action: 'assigned' } })) {
    await prisma.employeeSupportActivity.create({ data: { requestId: request.id, actorUserId: adminUserId, action: 'assigned', message: 'Assigned to People Operations.', metadata: { demo: true } } });
  }
  return 3;
}

async function seedPlatformModules(adminUserId: string) {
  const applicants = await prisma.applicant.findMany({
    where: { email: { endsWith: '@demo.hrive.local' } }, take: 6,
    select: { id: true, positionId: true, name: true },
  });
  for (let index = 0; index < applicants.length; index += 1) {
    const applicant = applicants[index];
    if (!await prisma.applicantEvaluation.findFirst({ where: { applicantId: applicant.id, evaluatorId: adminUserId } })) {
      await prisma.applicantEvaluation.create({ data: {
        applicantId: applicant.id, positionId: applicant.positionId, evaluatorId: adminUserId,
        status: index < 3 ? 'completed' : 'in_progress', overallScore: index < 3 ? 78 + index * 5 : null,
        comments: 'Synthetic structured evaluation for interviewer calibration.', completedAt: index < 3 ? new Date() : null,
      } });
    }
    if (!await prisma.jobMatch.findFirst({ where: { applicantId: applicant.id, jobId: applicant.positionId } })) {
      await prisma.jobMatch.create({ data: {
        applicantId: applicant.id, jobId: applicant.positionId, jobTitle: 'Recommended demo role',
        fitScore: 70 + index * 4, matchReasons: ['Relevant domain experience', 'Strong transferable skills'],
        jobDescriptionSummary: 'Example AI-assisted match generated from synthetic profile data.',
      } });
    }
  }
  if (applicants[0] && !await prisma.applicantEvaluationLink.findFirst({ where: { applicantId: applicants[0].id, createdById: adminUserId, revokedAt: null } })) {
    await prisma.applicantEvaluationLink.create({ data: {
      applicantId: applicants[0].id, createdById: adminUserId, token: `demo-evaluation-${randomUUID()}`,
      expiresAt: new Date(Date.now() + 30 * 86_400_000), requireLogin: true,
    } });
  }

  let dashboard = await prisma.dashboard.findFirst({ where: { userId: adminUserId, name: 'Demo workforce overview' } });
  dashboard ??= await prisma.dashboard.create({ data: {
    id: randomUUID(), userId: adminUserId, name: 'Demo workforce overview',
    description: 'Cross-module workforce, hiring, attendance, and payroll indicators.', updatedAt: new Date(),
  } });
  const widgetDefinitions = [
    ['headcount', 'Workforce headcount', 'employees'], ['pipeline', 'Hiring pipeline', 'applicants'],
    ['attendance', 'Attendance trend', 'attendance'], ['learning', 'Learning completion', 'learning'],
  ] as const;
  for (let index = 0; index < widgetDefinitions.length; index += 1) {
    const [type, title, dataSource] = widgetDefinitions[index];
    if (!await prisma.dashboardWidget.findFirst({ where: { dashboardId: dashboard.id, title } })) {
      await prisma.dashboardWidget.create({ data: { id: randomUUID(), dashboardId: dashboard.id, type, title, dataSource, config: { demo: true }, position: { x: index % 2, y: Math.floor(index / 2), w: 1, h: 1 }, updatedAt: new Date() } });
    }
  }

  if (!await prisma.webhook.findFirst({ where: { name: 'Demo HR event receiver' } })) {
    await prisma.webhook.create({ data: {
      name: 'Demo HR event receiver', url: 'https://example.invalid/hrive-demo-webhook', method: 'POST',
      events: ['applicant.created', 'employee.onboarded'], is_active: false, auth_type: 'none',
      headers: { 'X-Demo-Only': 'true' }, body_template: '{"event":"{{event}}","demo":true}',
    } });
  }

  await prisma.systemSetting.upsert({
    where: { key: 'companyPortalBuilderState' }, update: {},
    create: { key: 'companyPortalBuilderState', value: JSON.stringify(createDefaultCompanyPortalState()) },
  });
  if (applicants[0]) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO hr_workflow_tasks (id, task_type, source_domain, source_type, source_id, subject, summary, requester_user_id, requester_name, assignee_user_id, assignee_name, priority, due_at, status, deep_link, allowed_decisions, decision_handlers)
      VALUES (gen_random_uuid(), 'candidate_review', 'recruitment', 'applicant', $1::uuid, $2, 'Review the synthetic candidate profile and choose the next pipeline step.', $3::uuid, 'Demo administrator', $3::uuid, 'Demo administrator', 'high', NOW() + INTERVAL '2 days', 'pending', '/applicants/' || $1::text, '["advance","reject"]'::jsonb, '{"advance":"recruitment.advance","reject":"recruitment.reject"}'::jsonb)
      ON CONFLICT (source_domain, source_type, source_id, task_type, assignee_user_id) DO NOTHING
    `, applicants[0].id, `Review ${applicants[0].name}`, adminUserId);
  }
  if (!await prisma.logEntry.findFirst({ where: { source: 'demo-installation', message: 'All-module demo data initialized' } })) {
    await prisma.logEntry.create({ data: { level: 'INFO', message: 'All-module demo data initialized', source: 'demo-installation', actingUserId: adminUserId, details: { demo: true } } });
  }
  if (!await prisma.auditLog.findFirst({ where: { source: 'demo-installation', action: 'DEMO_DATA_INITIALIZED' } })) {
    await prisma.auditLog.create({ data: { level: 'INFO', message: 'Synthetic data initialized for training and evaluation', source: 'demo-installation', actingUserId: adminUserId, action: 'DEMO_DATA_INITIALIZED', entity: 'Installation', details: { synthetic: true } } });
  }
  return applicants.length * 2 + widgetDefinitions.length + 8;
}
