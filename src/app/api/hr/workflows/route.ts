import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';
import { getHrModuleConfig } from '@/lib/hr/hr-module-config';
import { executeHrWorkflowAction, getHrWorkflowDefinition } from '@/lib/hr/hr-workflows';

const workflowSchema = z.object({
  action: z.string().min(1),
  id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }

  const parsed = workflowSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid workflow input', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const definition = getHrWorkflowDefinition(parsed.data.action);
  if (!definition) {
    return NextResponse.json({ message: 'Unsupported HR workflow action.' }, { status: 400 });
  }

  const moduleConfig = getHrModuleConfig(definition.moduleKey);
  if (!hasAnyPermission(session.user, [moduleConfig.managePermission as PlatformModuleId])) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR manage permission.' }, { status: 403 });
  }

  const result = await executeHrWorkflowAction({
    action: definition.action,
    id: parsed.data.id,
    actingUserId: session.user.id,
  });

  if (!result.row) {
    return NextResponse.json({ message: 'Workflow action could not be applied to this record.' }, { status: 404 });
  }

  await logAudit(
    'AUDIT',
    `HR workflow action completed: ${definition.label}.`,
    `API:HR:Workflow:${definition.action}`,
    session.user.id,
    { id: parsed.data.id, module: definition.moduleKey },
  );

  return NextResponse.json({ data: result.row });
}
