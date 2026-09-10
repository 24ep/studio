import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Comprehensive Data Seeding...');

  // 1. Clear some existing data to avoid conflicts if needed, 
  // but we'll use upsert where possible for safety.
  
  // 2. Ensure Recruitment Stages
  console.log('--- Seeding Recruitment Stages ---');
  const stages = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Applied', sortOrder: 1, color_badge: '#60a5fa' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Shortlisted', sortOrder: 3, color_badge: '#fbbf24' },
    { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Interviewing', sortOrder: 5, color_badge: '#8b5cf6' },
    { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Hired', sortOrder: 8, color_badge: '#22c55e' },
    { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Rejected', sortOrder: 9, color_badge: '#f87171' }
  ];
  const requiredStageNames = new Set(['Applied', 'Hired', 'Rejected']);

  for (const s of stages) {
    await prisma.recruitmentStage.upsert({
      where: { id: s.id },
      update: { ...s, isSystem: requiredStageNames.has(s.name) },
      create: { ...s, isSystem: requiredStageNames.has(s.name), description: s.name }
    });
  }

  // 3. Seed Applicant Sources
  console.log('--- Seeding Applicant Sources ---');
  const sources = [
    { name: 'LinkedIn', description: 'LinkedIn Professional Network' },
    { name: 'JobDB', description: 'JobDB portal' },
    { name: 'Referral', description: 'Employee referrals' },
    { name: 'Company Website', description: 'Direct applications' }
  ];

  for (const src of sources) {
    await prisma.applicantSource.upsert({
      where: { name: src.name },
      update: src,
      create: { ...src, isActive: true, sortOrder: 0 }
    });
  }

  const allSources = await prisma.applicantSource.findMany();

  // 4. Seed Position Levels
  console.log('--- Seeding Position Levels ---');
  const levels = [
    { name: 'Junior', sortOrder: 1 },
    { name: 'Senior', sortOrder: 2 },
    { name: 'Lead', sortOrder: 3 },
    { name: 'Manager', sortOrder: 4 },
    { name: 'Director', sortOrder: 5 }
  ];
  for (const l of levels) {
    await prisma.positionLevel.upsert({
      where: { name: l.name },
      update: l,
      create: l
    });
  }
  const allLevels = await prisma.positionLevel.findMany();

  // 5. Seed Grades
  console.log('--- Seeding Grades ---');
  const grades = [
    { name: 'G1', label: 'Entry', minLevel: 1, maxLevel: 2, color: '#94a3b8' },
    { name: 'G2', label: 'Professional', minLevel: 3, maxLevel: 5, color: '#3b82f6' },
    { name: 'G3', label: 'Management', minLevel: 6, maxLevel: 8, color: '#8b5cf6' }
  ];
  for (const g of grades) {
    await prisma.grade.upsert({
      where: { name: g.name },
      update: g,
      create: { ...g, slaDays: 30 }
    });
  }
  const allGrades = await prisma.grade.findMany();

  // 6. Detailed Users
  console.log('--- Seeding Detailed Users ---');
  const hashedPassword = await bcrypt.hash('Demo@User#2024!', 10);
  
  const userGroups = await prisma.userGroup.findMany();
  const recruiterGroup = userGroups.find(g => g.name === 'Recruiter') || userGroups[0];
  const managerGroup = userGroups.find(g => g.name === 'Hiring Manager') || userGroups[0];

  const userData = [
    {
      name: 'System Admin',
      email: 'admin@example.com',
      role: 'Admin',
      department: 'IT Infrastructure',
      positionTitle: 'CTO / System Administrator',
      phoneNumber: '+66 2 000 0000',
      officeLocation: 'Headquarters',
      employeeId: 'ADMIN001',
      personalColor: '#000000',
      userGroupId: recruiterGroup.id
    },
    {
      name: 'Sarah Connor',
      email: 'sarah.c@outboundcorporation.com',
      role: 'Recruiter',
      department: 'HR Operations',
      positionTitle: 'Senior Talent Acquisition',
      phoneNumber: '+66 81 123 4567',
      officeLocation: 'Bangkok Office',
      employeeId: 'EMP001',
      personalColor: '#ec4899',
      userGroupId: recruiterGroup.id
    },
    {
      name: 'James Bond',
      email: 'james.b@outboundcorporation.com',
      role: 'Hiring Manager',
      department: 'Technology',
      positionTitle: 'VP of Engineering',
      phoneNumber: '+66 82 234 5678',
      officeLocation: 'Remote',
      employeeId: 'EMP007',
      personalColor: '#06b6d4',
      userGroupId: managerGroup.id
    }
  ];

  for (const u of userData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: {
        ...u,
        password: await bcrypt.hash(u.email === 'admin@example.com' ? 'Admin@123' : 'Demo@User#2024!', 10),
        authenticationMethods: ['basic'],
        isActive: true
      }
    });
  }
  const allUsers = await prisma.user.findMany();
  const sarah = allUsers.find(u => u.email === 'sarah.c@outboundcorporation.com')!;
  const james = allUsers.find(u => u.email === 'james.b@outboundcorporation.com')!;

  // 7. Seed Positions
  console.log('--- Seeding Detailed Positions ---');
  const positionData = [
    {
      title: 'Senior Frontend Developer',
      department: 'Product Engineering',
      description: 'We are looking for an experienced Frontend Developer to lead our UI efforts.',
      positionLevel: 'Senior',
      gradeId: allGrades.find(g => g.name === 'G2')?.id,
      recruiterId: sarah.id,
      isOpen: true,
      matchCriteria: 'React, TypeScript, TailwindCSS, Next.js'
    },
    {
      title: 'Fullstack Engineer',
      department: 'Core Platform',
      description: 'Help us build robust APIs and dynamic interfaces.',
      positionLevel: 'Lead',
      gradeId: allGrades.find(g => g.name === 'G2')?.id,
      recruiterId: sarah.id,
      isOpen: true,
      matchCriteria: 'Node.js, PostgreSQL, React, AWS'
    }
  ];


  for (const p of positionData) {
    const existing = await prisma.position.findFirst({
      where: { title: p.title, department: p.department }
    });
    
    if (existing) {
      await prisma.position.update({
        where: { id: existing.id },
        data: p
      });
    } else {
      await prisma.position.create({
        data: p
      });
    }
  }

  const allPositions = await prisma.position.findMany();
  const frontendPos = allPositions.find(p => p.title.includes('Frontend'))!;
  const fullstackPos = allPositions.find(p => p.title.includes('Fullstack'))!;

  // 8. Assign Interviewers
  console.log('--- Assigning Interviewers ---');
  await prisma.positionInterviewer.upsert({
    where: { positionId_userId: { positionId: frontendPos.id, userId: james.id } },
    update: {},
    create: { positionId: frontendPos.id, userId: james.id }
  });
  await prisma.positionInterviewer.upsert({
    where: { positionId_userId: { positionId: fullstackPos.id, userId: james.id } },
    update: {},
    create: { positionId: fullstackPos.id, userId: james.id }
  });

  // 9. Seed Applicants
  console.log('--- Seeding Detailed Applicants ---');
  const applicantData = [
    {
      name: 'John Doe',
      email: 'john.doe@gmail.com',
      phone: '081-111-2222',
      positionId: frontendPos.id,
      recruiterId: sarah.id,
      statusId: stages[0].id,
      sourceId: allSources.find(s => s.name === 'LinkedIn')?.id,
      fitScore: 85,
      educationData: [
        { degree: 'B.Sc. Computer Science', school: 'MIT', year: '2018' }
      ],
      experienceData: [
        { title: 'Frontend Dev', company: 'Google', years: '3' }
      ],
      parsedData: {
        skills: ['React', 'TypeScript', 'CSS'],
        languages: ['English', 'Thai']
      }
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@yahoo.com',
      phone: '082-222-3333',
      positionId: frontendPos.id,
      recruiterId: sarah.id,
      statusId: stages[1].id,
      sourceId: allSources.find(s => s.name === 'JobDB')?.id,
      fitScore: 92,
      educationData: [
        { degree: 'B.Eng. Computer Engineering', school: 'Stanford', year: '2017' }
      ],
      experienceData: [
        { title: 'Senior Web Dev', company: 'Facebook', years: '5' }
      ],
      parsedData: {
        skills: ['React', 'Next.js', 'Redux'],
        languages: ['English']
      }
    },
    {
      name: 'Bob Wilson',
      email: 'bob.wilson@outlook.com',
      phone: '083-333-4444',
      positionId: fullstackPos.id,
      recruiterId: sarah.id,
      statusId: stages[0].id,
      sourceId: allSources.find(s => s.name === 'Referral')?.id,
      fitScore: 78,
      educationData: [
        { degree: 'M.Sc. Software Engineering', school: 'CMU', year: '2019' }
      ],
      experienceData: [
        { title: 'Fullstack Dev', company: 'Amazon', years: '2' }
      ],
      parsedData: {
        skills: ['Node.js', 'React', 'PostgreSQL'],
        languages: ['English', 'Spanish']
      }
    }
  ];


  for (const a of applicantData) {
    const existing = await prisma.applicant.findFirst({
      where: { email: a.email, positionId: a.positionId }
    });
    
    if (existing) {
      await prisma.applicant.update({
        where: { id: existing.id },
        data: a
      });
    } else {
      await prisma.applicant.create({
        data: a
      });
    }
  }

  const allApplicants = await prisma.applicant.findMany();

  // 10. Seed Evaluations
  console.log('--- Seeding Evaluations ---');
  for (const applicant of allApplicants) {
    if (applicant.statusId === stages[1].id || Math.random() > 0.5) {
      await prisma.applicantEvaluation.create({
        data: {
          applicantId: applicant.id,
          positionId: applicant.positionId,
          evaluatorId: james.id,
          status: 'completed',
          overallScore: 80 + Math.floor(Math.random() * 20),
          comments: 'Highly recommended for the next round.',
          completedAt: new Date()
        }
      });
    }
  }

  // 11. Seed Evaluation Links
  console.log('--- Seeding Evaluation Links ---');
  for (const applicant of allApplicants) {
    await prisma.applicantEvaluationLink.create({
      data: {
        applicantId: applicant.id,
        token: uuidv4(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdById: sarah.id,
        requireLogin: false
      }
    });
  }

  console.log('✅ Comprehensive Data Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
