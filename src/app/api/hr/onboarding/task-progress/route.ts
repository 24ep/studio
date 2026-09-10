import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

const taskProgressSchema = z.object({
  onboardingId: z.string().uuid(),
  employeeId: z.string().uuid(),
  taskId: z.string().uuid(),
  completed: z.boolean(),
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!hasPermission(session.user, 'HR_PEOPLE_MANAGE')) {
    return NextResponse.json({ message: 'Forbidden: HR People manage permission required.' }, { status: 403 });
  }

  const parsed = taskProgressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid onboarding task update.', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { onboardingId, employeeId, taskId, completed } = parsed.data;
  try {
    const result = await prisma.$transaction(async transaction => {
      const matchingTasks = await transaction.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT task.id
         FROM "hr_employee_onboarding" onboarding
         JOIN "hr_onboarding_tasks" task ON task.template_id = onboarding.template_id
         WHERE onboarding.id = $1::uuid
           AND onboarding.employee_id = $2::uuid
           AND task.id = $3::uuid
         LIMIT 1`,
        onboardingId,
        employeeId,
        taskId,
      );
      if (!matchingTasks[0]) return null;

      await transaction.$executeRawUnsafe(
        `INSERT INTO "hr_employee_onboarding_task_progress"
          ("id", "onboarding_id", "task_id", "employee_id", "status", "completed_at", "created_at", "updated_at")
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, CASE WHEN $5 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("onboarding_id", "task_id")
         DO UPDATE SET "status" = EXCLUDED."status", "completed_at" = EXCLUDED."completed_at", "updated_at" = CURRENT_TIMESTAMP`,
        randomUUID(),
        onboardingId,
        taskId,
        employeeId,
        completed ? 'completed' : 'pending',
      );

      const counts = await transaction.$queryRawUnsafe<Array<{ total: bigint | number | string; completed: bigint | number | string }>>(
        `SELECT COUNT(task.id) AS total,
                COUNT(progress.id) FILTER (WHERE progress.status = 'completed') AS completed
         FROM "hr_employee_onboarding" onboarding
         JOIN "hr_onboarding_tasks" task ON task.template_id = onboarding.template_id
         LEFT JOIN "hr_employee_onboarding_task_progress" progress
           ON progress.onboarding_id = onboarding.id AND progress.task_id = task.id
         WHERE onboarding.id = $1::uuid AND onboarding.employee_id = $2::uuid`,
        onboardingId,
        employeeId,
      );
      const totalTasks = Number(counts[0]?.total || 0);
      const completedTasks = Number(counts[0]?.completed || 0);
      const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await transaction.$executeRawUnsafe(
        `UPDATE "hr_employee_onboarding"
         SET "progress" = $3,
             "status" = CASE WHEN $3 >= 100 THEN 'completed' ELSE 'in_progress' END,
             "completed_at" = CASE WHEN $3 >= 100 THEN CURRENT_TIMESTAMP ELSE NULL END,
             "updated_at" = CURRENT_TIMESTAMP
         WHERE "id" = $1::uuid AND "employee_id" = $2::uuid`,
        onboardingId,
        employeeId,
        progress,
      );

      return { taskId, status: completed ? 'completed' : 'pending', progress, completedTasks, totalTasks };
    });

    if (!result) return NextResponse.json({ message: 'Onboarding task not found for this employee journey.' }, { status: 404 });
    await logAudit('AUDIT', 'Onboarding task progress updated.', 'API:HR:Onboarding:TaskProgress', session.user.id, {
      onboardingId,
      employeeId,
      taskId,
      completed,
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[HR onboarding] Task progress update failed:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update onboarding task.' }, { status: 500 });
  }
}
