import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const goalSchema = z.object({
  positionId: z.string().uuid(),
  readiness: z.number().int().min(0).max(100),
});

type SkillInput = string | { name?: unknown; title?: unknown; skill?: unknown };

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function tokens(value: unknown) {
  return new Set(normalize(value).split(/[^a-z0-9+#.]+/).filter(token => token.length > 2));
}

function profileSkillNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (typeof item === 'string') return item;
    const skill = item as SkillInput;
    return typeof skill === 'object' && skill
      ? String(skill.name || skill.title || skill.skill || '').trim()
      : '';
  }).filter(Boolean);
}

function overlapScore(source: Set<string>, target: Set<string>) {
  if (!target.size) return 0;
  let matched = 0;
  target.forEach(token => { if (source.has(token)) matched += 1; });
  return matched / target.size;
}

function monthsFor(readiness: number) {
  if (readiness >= 75) return '3–6';
  if (readiness >= 55) return '6–12';
  return '12–18';
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });

  const employee = await getEmployeeForUser(session.user.id, session.user.email);
  if (!employee) {
    return NextResponse.json({ state: 'unlinked', data: null, message: 'Link an employee profile to explore career paths.' });
  }

  const employeeSkills = profileSkillNames(employee.skills);
  const completedEnrollments = await prisma.learningEnrollment.findMany({
    where: { employeeId: employee.id, status: 'completed' },
    select: { courseId: true },
  });
  const completedLearning = completedEnrollments.length ? await prisma.learningCourse.findMany({
    where: { id: { in: completedEnrollments.map(item => item.courseId) } },
    select: { title: true, category: true },
  }) : [];
  const verifiedCertificates = await prisma.certification.findMany({
    where: { employeeId: employee.id, status: 'active', verificationStatus: 'verified' },
    select: { name: true, issuer: true },
  });
  const positions = await prisma.position.findMany({
    where: {
      isOpen: true,
      NOT: employee.job_title ? { title: { equals: employee.job_title, mode: 'insensitive' } } : undefined,
    },
    select: {
      id: true,
      title: true,
      department: true,
      description: true,
      matchCriteria: true,
      positionLevel: true,
      expertiseSkills: {
        select: {
          isRequired: true,
          weight: true,
          minScore: true,
          skill: { select: { name: true, description: true, skillType: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
  const courses = await prisma.learningCourse.findMany({
    where: { isActive: true },
    select: { id: true, title: true, category: true, description: true, durationHours: true },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  const activeGoal = await prisma.performanceGoal.findFirst({
    where: { employeeId: employee.id, status: 'active', title: { startsWith: 'Career goal:' } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, description: true, dueDate: true, keyResults: true },
  });

  const evidenceText = [
    employee.job_title,
    employee.department_name,
    ...employeeSkills,
    ...completedLearning.flatMap(item => [item.title, item.category]),
    ...verifiedCertificates.flatMap(item => [item.name, item.issuer]),
  ].filter(Boolean).join(' ');
  const evidenceTokens = tokens(evidenceText);

  const roles = positions.map(position => {
    const requirements = position.expertiseSkills.map(assignment => ({
      title: assignment.skill.name,
      detail: assignment.skill.description || `${assignment.skill.skillType.replaceAll('_', ' ')} for this role.`,
      required: assignment.isRequired,
      weight: assignment.weight,
    }));
    const matchedRequirements = requirements.filter(requirement => overlapScore(evidenceTokens, tokens(requirement.title)) > 0);
    const missingRequirements = requirements.filter(requirement => !matchedRequirements.includes(requirement));
    const roleTokens = tokens(`${position.title} ${position.department} ${position.description || ''} ${position.matchCriteria || ''}`);
    const requirementCoverage = requirements.length ? matchedRequirements.length / requirements.length : overlapScore(evidenceTokens, roleTokens);
    const learningBonus = Math.min(12, completedLearning.length * 2);
    const certificateBonus = Math.min(8, verifiedCertificates.length * 2);
    const departmentBonus = normalize(position.department) === normalize(employee.department_name) ? 8 : 0;
    const readiness = Math.max(20, Math.min(95, Math.round(28 + requirementCoverage * 47 + learningBonus + certificateBonus + departmentBonus)));
    const gapTokens = new Set(missingRequirements.flatMap(requirement => [...tokens(requirement.title)]));
    const recommendedCourse = courses
      .map(course => ({ course, score: overlapScore(tokens(`${course.title} ${course.category || ''} ${course.description || ''}`), gapTokens) }))
      .sort((a, b) => b.score - a.score)[0]?.course || null;

    const strengths = matchedRequirements.length
      ? matchedRequirements.slice(0, 3).map(requirement => ({ title: requirement.title, detail: `Supported by your profile, completed learning, or verified credentials.` }))
      : employeeSkills.slice(0, 3).map(title => ({ title, detail: 'Recorded on your employee skill profile.' }));
    const gaps = missingRequirements.slice(0, 3).map(requirement => ({ title: requirement.title, detail: requirement.detail }));

    return {
      id: position.id,
      title: position.title,
      department: position.department,
      readiness,
      comparisonReadiness: readiness,
      months: monthsFor(readiness),
      destinationMonths: `${monthsFor(Math.max(20, readiness - 12))} months`,
      intermediateRole: position.positionLevel || `Develop toward ${position.title}`,
      description: position.description || `Build the skills required to move into ${position.title}.`,
      change: position.matchCriteria || `This path moves you from ${employee.job_title || 'your current role'} toward ${position.title}.`,
      strengths,
      gaps,
      course: recommendedCourse,
    };
  }).sort((a, b) => b.readiness - a.readiness).slice(0, 3);

  return NextResponse.json({
    state: 'ready',
    data: {
      employee: {
        id: employee.id,
        name: [employee.preferred_name || employee.first_name, employee.last_name].filter(Boolean).join(' '),
        jobTitle: employee.job_title,
        department: employee.department_name,
      },
      evidence: { skills: employeeSkills, completedCourses: completedLearning.length, verifiedCertificates: verifiedCertificates.length },
      roles,
      goal: activeGoal,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const parsed = goalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Choose a valid career path.' }, { status: 400 });

  const employee = await getEmployeeForUser(session.user.id, session.user.email);
  if (!employee) return NextResponse.json({ message: 'No employee record is linked to this user.' }, { status: 404 });
  const position = await prisma.position.findUnique({ where: { id: parsed.data.positionId }, select: { id: true, title: true, department: true } });
  if (!position) return NextResponse.json({ message: 'The selected position is no longer available.' }, { status: 404 });

  const currentGoal = await prisma.performanceGoal.findFirst({
    where: { employeeId: employee.id, status: 'active', title: { startsWith: 'Career goal:' } },
    orderBy: { updatedAt: 'desc' },
  });
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + (parsed.data.readiness >= 70 ? 6 : parsed.data.readiness >= 50 ? 12 : 18));
  const goalData = {
    title: `Career goal: ${position.title}`,
    description: `Develop toward ${position.title} in ${position.department}.`,
    status: 'active',
    progress: parsed.data.readiness,
    dueDate,
    keyResults: [{ type: 'career_position', positionId: position.id, roleTitle: position.title, readinessAtSelection: parsed.data.readiness }],
  };
  const goal = currentGoal
    ? await prisma.performanceGoal.update({ where: { id: currentGoal.id }, data: goalData })
    : await prisma.performanceGoal.create({ data: { employeeId: employee.id, ...goalData } });

  await logAudit('AUDIT', 'Employee career goal selected.', 'API:Learning:CareerExplorer:Goal', session.user.id, { goalId: goal.id, positionId: position.id });
  return NextResponse.json({ data: goal }, { status: currentGoal ? 200 : 201 });
}
