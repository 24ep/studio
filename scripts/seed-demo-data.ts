import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SECURITY: Demo seed passwords from environment variable with secure fallback
const DEMO_SEED_PASSWORD = process.env.DEMO_SEED_PASSWORD || 'CHANGE_ME_DEMO_SEED_PASSWORD';

async function ensureRecruiterUser() {
  // Use existing admin as recruiter/evaluator fallback
  const admin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
  if (admin) return admin;

  // Very small fallback in case seed.ts not run
  return prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: DEMO_SEED_PASSWORD,
      role: 'Admin',
      authenticationMethods: ['basic'],
      forcePasswordChange: true
    }
  });
}

async function upsertPosition(title: string, department: string, recruiterId?: string) {
  const existing = await prisma.position.findFirst({ where: { title } });
  if (existing) return existing;
  return prisma.position.create({
    data: {
      title,
      department,
      description: `${title} position in ${department}`,
      matchCriteria: '<ul><li>Relevant experience</li><li>Good communication</li></ul>',
      isOpen: true,
      recruiterId: recruiterId ?? null
    }
  });
}

async function upsertapplicant(name: string, email: string, positionId?: string, recruiterId?: string) {
  const existing = await prisma.applicant.findFirst({ where: { email } });
  if (existing) return existing;
  return prisma.applicant.create({
    data: {
      name,
      email,
      phone: '090-000-0000',
      positionId: positionId ?? null,
      recruiterId: recruiterId ?? null,
      fitScore: Math.round(Math.random() * 100),
      parsedData: {
        skills: ['JavaScript', 'React', 'SQL'].slice(0, Math.floor(Math.random() * 3) + 1)
      }
    }
  });
}

async function ensureExpertiseCatalog() {
  // Create a small catalog of groups/skills if empty
  const existingSkill = await prisma.expertiseSkill.findFirst();
  if (existingSkill) return;

  const feGroup = await prisma.expertiseGroup.create({
    data: { name: 'Frontend', description: 'Frontend skills', color: '#3B82F6', sortOrder: 1 }
  });
  const beGroup = await prisma.expertiseGroup.create({
    data: { name: 'Backend', description: 'Backend skills', color: '#10B981', sortOrder: 2 }
  });

  await prisma.expertiseSkill.createMany({
    data: [
      { name: 'React', description: 'React.js', groupId: feGroup.id, sortOrder: 1, maxScore: 100, skillType: 'hard_skill' },
      { name: 'TypeScript', description: 'TypeScript', groupId: feGroup.id, sortOrder: 2, maxScore: 100, skillType: 'hard_skill' },
      { name: 'Node.js', description: 'Node.js', groupId: beGroup.id, sortOrder: 1, maxScore: 100, skillType: 'hard_skill' },
      { name: 'PostgreSQL', description: 'PostgreSQL', groupId: beGroup.id, sortOrder: 2, maxScore: 100, skillType: 'hard_skill' }
    ]
  });
}

async function ensureSkillTemplate() {
  let template = await prisma.skillTemplate.findFirst({ where: { name: 'Standard Engineering' } });
  if (template) return template;

  template = await prisma.skillTemplate.create({
    data: {
      name: 'Standard Engineering',
      description: 'Common engineering skills'
    }
  });

  const skills = await prisma.expertiseSkill.findMany({
    where: { name: { in: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'] } }
  });

  // Link groups
  const groups = await prisma.expertiseGroup.findMany({
    where: { name: { in: ['Frontend', 'Backend'] } }
  });

  await prisma.skillTemplateGroup.createMany({
    data: groups.map((g: { id: string }) => ({ templateId: template.id, groupId: g.id }))
  });

  await prisma.skillTemplateSkill.createMany({
    data: skills.map((s: { id: string }) => ({ templateId: template.id, skillId: s.id }))
  });

  return template;
}

async function ensurePersonalityCatalog() {
  const existingTrait = await prisma.personalityTrait.findFirst();
  if (existingTrait) return;

  const comms = await prisma.personalityGroup.create({
    data: { name: 'Communication', description: 'Communication-related traits', color: '#F59E0B', sortOrder: 1 }
  });
  const teamwork = await prisma.personalityGroup.create({
    data: { name: 'Teamwork', description: 'Teamwork-related traits', color: '#8B5CF6', sortOrder: 2 }
  });

  await prisma.personalityTrait.createMany({
    data: [
      { name: 'Proactive', description: 'Shows initiative', groupId: teamwork.id, sortOrder: 1 },
      { name: 'Detail Oriented', description: 'Attention to detail', groupId: teamwork.id, sortOrder: 2 },
      { name: 'Clear Communicator', description: 'Communicates clearly', groupId: comms.id, sortOrder: 1 },
      { name: 'Collaborative', description: 'Works well with others', groupId: teamwork.id, sortOrder: 3 }
    ]
  });
}

async function createPositionAssignments(positionId: string) {
  // Assign template skills to the position for weighting
  const skills = await prisma.expertiseSkill.findMany({
    where: { name: { in: ['React', 'TypeScript', 'Node.js'] } }
  });

  for (const [index, skill] of skills.entries()) {
    const exists = await prisma.positionExpertiseSkill.findFirst({ where: { positionId, skillId: skill.id } });
    if (!exists) {
      await prisma.positionExpertiseSkill.create({
        data: {
          positionId,
          skillId: skill.id,
          isRequired: index < 2,
          weight: index < 2 ? 1.5 : 1.0,
          minScore: 60
        }
      });
    }
  }
}

async function createPositionPersonalityAssignments(positionId: string) {
  const traits = await prisma.personalityTrait.findMany({
    where: { name: { in: ['Proactive', 'Detail Oriented', 'Clear Communicator'] } }
  });

  for (const [index, trait] of traits.entries()) {
    const exists = await prisma.positionPersonalityTrait.findFirst({ where: { positionId, traitId: trait.id } });
    if (!exists) {
      await prisma.positionPersonalityTrait.create({
        data: {
          positionId,
          traitId: trait.id,
          isRequired: index < 2,
          weight: index < 2 ? 1.25 : 1.0
        }
      });
    }
  }
}

async function createEvaluation(applicantId: string, positionId: string | null, evaluatorId: string) {
  // Create a simple evaluation with expertise scores
  const evaluation = await prisma.applicantEvaluation.create({
    data: {
      applicantId,
      positionId,
      evaluatorId,
      status: 'completed',
      overallScore: Math.round(Math.random() * 40 + 60),
      comments: 'Auto-generated demo evaluation',
      completedAt: new Date()
    }
  });

  const skills = await prisma.expertiseSkill.findMany({
    where: { name: { in: ['React', 'TypeScript', 'Node.js'] } }
  });

  for (const skill of skills) {
    await prisma.applicantExpertiseScore.create({
      data: {
        evaluationId: evaluation.id,
        skillId: skill.id,
        score: Math.round(Math.random() * 40 + 60),
        notes: 'Demo score'
      }
    });
  }

  // Add personality scores
  const traits = await prisma.personalityTrait.findMany({
    where: { name: { in: ['Proactive', 'Clear Communicator'] } }
  });

  for (const trait of traits) {
    await prisma.applicantPersonalityScore.create({
      data: {
        evaluationId: evaluation.id,
        traitId: trait.id,
        score: Math.round(Math.random() * 40 + 60),
        notes: 'Demo personality score'
      }
    });
  }
}

async function createEvaluationLink(applicantId: string, createdById: string) {
  // Check if link already exists for this applicant
  const existing = await prisma.applicantEvaluationLink.findFirst({
    where: { applicantId }
  });
  if (existing) return existing;

  // Create a random token
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Set expiry to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return prisma.applicantEvaluationLink.create({
    data: {
      applicantId,
      token,
      expiresAt,
      createdById,
      requireLogin: false  // Public link for demo
    }
  });
}

async function createInterviewers(positionId: string, userIds: string[]) {
  // Add users as interviewers for the position
  for (const userId of userIds) {
    const existing = await prisma.positionInterviewer.findFirst({
      where: { positionId, userId }
    });
    if (!existing) {
      await prisma.positionInterviewer.create({
        data: { positionId, userId }
      });
    }
  }
}

async function createDemoUsers() {
  // Create additional demo users as interviewers
  const users = [
    { name: 'John Smith', email: 'john.smith@demo.com', role: 'HiringManager' },
    { name: 'Emily Chen', email: 'emily.chen@demo.com', role: 'Recruiter' },
    { name: 'Michael Brown', email: 'michael.brown@demo.com', role: 'HiringManager' }
  ];

  const createdUsers = [];
  for (const user of users) {
    let existing = await prisma.user.findFirst({ where: { email: user.email } });
    if (!existing) {
      existing = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: DEMO_SEED_PASSWORD,
          role: user.role,
          authenticationMethods: ['basic'],
          forcePasswordChange: false
        }
      });
    }
    createdUsers.push(existing);
  }
  return createdUsers;
}

async function main() {
  console.log('🌱 Seeding demo data: positions, applicants, evaluations, links, and interviewers');

  const recruiter = await ensureRecruiterUser();
  const demoUsers = await createDemoUsers();

  await ensureExpertiseCatalog();
  await ensureSkillTemplate();
  await ensurePersonalityCatalog();

  // Create sample positions
  const pos1 = await upsertPosition('Frontend Developer', 'Engineering', recruiter.id);
  const pos2 = await upsertPosition('Backend Developer', 'Engineering', recruiter.id);

  await createPositionAssignments(pos1.id);
  await createPositionAssignments(pos2.id);
  await createPositionPersonalityAssignments(pos1.id);
  await createPositionPersonalityAssignments(pos2.id);

  // Add interviewers to positions
  const interviewerIds = demoUsers.map(u => u.id);
  await createInterviewers(pos1.id, interviewerIds);
  await createInterviewers(pos2.id, interviewerIds);
  console.log('✓ Interviewers assigned to positions');

  // Create sample applicants
  const applicants = await Promise.all([
    upsertapplicant('Alex Rodriguez', 'alex.rodriguez@example.com', pos1.id, recruiter.id),
    upsertapplicant('Priya Singh', 'priya.singh@example.com', pos1.id, recruiter.id),
    upsertapplicant('Kenji Tanaka', 'kenji.tanaka@example.com', pos2.id, recruiter.id),
    upsertapplicant('Sara Ahmed', 'sara.ahmed@example.com', pos2.id, recruiter.id),
    upsertapplicant('Liam O\'Connor', 'liam.oconnor@example.com', undefined, recruiter.id)
  ]);

  // Create evaluations for first three applicants
  for (let i = 0; i < Math.min(3, applicants.length); i++) {
    const c = applicants[i];
    await createEvaluation(c.id, c.positionId ?? null, recruiter.id);
  }

  // Create evaluation links for all applicants
  for (const applicant of applicants) {
    await createEvaluationLink(applicant.id, recruiter.id);
  }
  console.log('✓ Evaluation links created for all applicants');

  console.log('Demo data seeded successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


