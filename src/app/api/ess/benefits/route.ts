import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { NotificationService } from '@/lib/notificationService';
import { resolveBenefitTransition } from '@/lib/hr/benefit-lifecycle';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const applicationSchema = z.object({
  benefitPlanId: z.string().uuid(),
  effectiveFrom: z.string().date(),
  lifeEventType: z.enum(['new_enrollment', 'marriage', 'birth_or_adoption', 'loss_of_coverage', 'other']).default('new_enrollment'),
  dependents: z.array(z.object({ name: z.string().trim().min(2).max(160), relationship: z.string().trim().min(2).max(80) })).max(20).default([]),
});

const employeeActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['withdraw', 'resubmit', 'request_termination']),
  expectedVersion: z.coerce.number().int().positive(),
});

async function context() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const employee = await getEmployeeForUser(session.user.id, session.user.email);
  return employee ? { session, employee } : null;
}

async function notifyManager(managerEmployeeId: string | null | undefined, title: string, message: string, enrollmentId: string, actorUserId: string) {
  if (!managerEmployeeId) return;
  const rows = await prisma.$queryRawUnsafe<Array<{ user_id: string | null }>>(
    `SELECT user_id FROM "hr_employees" WHERE id = $1::uuid LIMIT 1`,
    managerEmployeeId,
  );
  const managerUserId = rows[0]?.user_id;
  if (!managerUserId) return;
  await NotificationService.createNotification(managerUserId, {
    type: 'ess_approval_required',
    title,
    message,
    data: { href: '/ess/team', enrollmentId, requestType: 'benefit_enrollment' },
  }, actorUserId).catch(() => null);
}

export async function GET() {
  const access = await context();
  if (!access) return NextResponse.json({ error: 'An employee account is required.' }, { status: 401 });
  const now = new Date();
  const [plans, enrollmentRows] = await Promise.all([
    prisma.benefitPlan.findMany({
      where: {
        isActive: true,
        OR: [{ companyId: access.employee.company_id }, { companyId: null }],
        AND: [{ OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] }, { OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }],
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    }),
    prisma.employeeBenefitEnrollment.findMany({
      where: { employeeId: access.employee.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  const planById = new Map(plans.map(plan => [plan.id, plan]));
  const missingPlanIds = enrollmentRows.map(row => row.benefitPlanId).filter(id => !planById.has(id));
  if (missingPlanIds.length) {
    const historicalPlans = await prisma.benefitPlan.findMany({ where: { id: { in: missingPlanIds } } });
    historicalPlans.forEach(plan => planById.set(plan.id, plan));
  }
  const enrollments = enrollmentRows.map(row => ({ ...row, benefitPlan: planById.get(row.benefitPlanId) }));
  return NextResponse.json({
    data: {
      employee: { id: access.employee.id, name: [access.employee.preferred_name || access.employee.first_name, access.employee.last_name].filter(Boolean).join(' ') },
      plans,
      enrollments,
    },
  });
}

export async function POST(request: Request) {
  const access = await context();
  if (!access) return NextResponse.json({ error: 'An employee account is required.' }, { status: 401 });
  const parsed = applicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid benefit application.' }, { status: 422 });
  if (parsed.data.effectiveFrom < new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: 'Coverage start cannot be in the past.' }, { status: 422 });

  const plan = await prisma.benefitPlan.findFirst({ where: { id: parsed.data.benefitPlanId, isActive: true, OR: [{ companyId: access.employee.company_id }, { companyId: null }] } });
  if (!plan) return NextResponse.json({ error: 'This benefit plan is not available to your company.' }, { status: 404 });
  const existing = await prisma.employeeBenefitEnrollment.findUnique({ where: { employeeId_benefitPlanId: { employeeId: access.employee.id, benefitPlanId: plan.id } } });
  if (existing && !['ended', 'cancelled', 'rejected', 'withdrawn'].includes(existing.status)) return NextResponse.json({ error: 'You already have an active or pending application for this plan.' }, { status: 409 });

  const enrollment = await prisma.employeeBenefitEnrollment.upsert({
    where: { employeeId_benefitPlanId: { employeeId: access.employee.id, benefitPlanId: plan.id } },
    create: { employeeId: access.employee.id, benefitPlanId: plan.id, companyId: access.employee.company_id, status: 'pending_approval', effectiveFrom: new Date(`${parsed.data.effectiveFrom}T00:00:00.000Z`), lifeEventType: parsed.data.lifeEventType, dependents: parsed.data.dependents, employeeContribution: plan.employeeCost, employerContribution: plan.employerCost },
    update: { status: 'pending_approval', endedAt: null, effectiveTo: null, effectiveFrom: new Date(`${parsed.data.effectiveFrom}T00:00:00.000Z`), lifeEventType: parsed.data.lifeEventType, dependents: parsed.data.dependents, employeeContribution: plan.employeeCost, employerContribution: plan.employerCost, version: { increment: 1 } },
  });
  await logAudit('AUDIT', `Employee applied for benefit plan '${plan.name}'.`, 'API:ESS:Benefits:Apply', access.session.user.id, { enrollmentId: enrollment.id, benefitPlanId: plan.id });
  await notifyManager(access.employee.manager_id, 'Benefit application needs review', `${plan.name} is awaiting your decision.`, enrollment.id, access.session.user.id);
  return NextResponse.json({ data: enrollment }, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await context();
  if (!access) return NextResponse.json({ error: 'An employee account is required.' }, { status: 401 });
  const parsed = employeeActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid benefit action.' }, { status: 422 });

  const current = await prisma.employeeBenefitEnrollment.findFirst({
    where: { id: parsed.data.id, employeeId: access.employee.id },
  });
  if (!current) return NextResponse.json({ error: 'Benefit application not found.' }, { status: 404 });
  if (current.version !== parsed.data.expectedVersion) return NextResponse.json({ error: 'This benefit application changed. Refresh before trying again.' }, { status: 409 });
  const plan = await prisma.benefitPlan.findUnique({ where: { id: current.benefitPlanId } });
  const benefitName = plan?.name || 'Benefit plan';

  let nextStatus: string;
  try {
    nextStatus = resolveBenefitTransition(current.status, parsed.data.action, 'employee');
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Benefit action is no longer available.' }, { status: 409 });
  }

  const changed = await prisma.employeeBenefitEnrollment.updateMany({
    where: { id: current.id, employeeId: access.employee.id, version: parsed.data.expectedVersion },
    data: { status: nextStatus, version: { increment: 1 } },
  });
  if (changed.count !== 1) return NextResponse.json({ error: 'This benefit application changed. Refresh before trying again.' }, { status: 409 });
  const enrollment = await prisma.employeeBenefitEnrollment.findUnique({ where: { id: current.id } });

  await logAudit('AUDIT', `Employee benefit action: ${parsed.data.action}.`, 'API:ESS:Benefits:Action', access.session.user.id, {
    enrollmentId: current.id,
    fromStatus: current.status,
    toStatus: nextStatus,
  });
  if (nextStatus === 'pending_approval' || nextStatus === 'pending_termination') {
    await notifyManager(
      access.employee.manager_id,
      nextStatus === 'pending_termination' ? 'Benefit termination needs review' : 'Benefit application needs review',
      `${benefitName} is awaiting your decision.`,
      current.id,
      access.session.user.id,
    );
  }
  return NextResponse.json({ data: enrollment });
}
