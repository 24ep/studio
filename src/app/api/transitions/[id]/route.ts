import { auth } from '@/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { getPool, type DbClient } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  buildTransitionUpdateQuery,
  getTransitionRouteErrorMessage,
  updateTransitionSchema,
} from './transition-detail-utils';
import {
  broadcastTransitionChange,
  enforceTransitionOwnership,
  fetchTransitionRecord,
  requireTransitionRoutePermission,
  resolveTransitionRouteId,
  type TransitionRecordRow,
} from './transition-detail-route-helpers';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  const idResult = resolveTransitionRouteId(request);
  if ('response' in idResult) {
    return idResult.response;
  }
  const { id } = idResult;
  
  const session = await auth();
  const actingUserId = session?.user?.id;
  const permission = await requireTransitionRoutePermission({ action: 'Update', actingUserId, session });
  if ('response' in permission) {
    return permission.response;
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: "Error parsing request body", error: getTransitionRouteErrorMessage(bodyResult.error) }, { status: 400 });
  }

  const body = bodyResult.value;
  const validationResult = updateTransitionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ message: "Invalid input", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }
  
  const client: DbClient = await getPool().connect();
  try {
    const currentTransition = await fetchTransitionRecord(client, id);
    if (!currentTransition) {
      return NextResponse.json({ message: "Transition record not found" }, { status: 404 });
    }
    
    const ownershipResponse = await enforceTransitionOwnership({
      action: 'Update',
      actingUserId: actingUserId!,
      hasGlobalPermission: permission.hasGlobalPermission,
      session,
      transition: currentTransition,
    });
    if (ownershipResponse) {
      return ownershipResponse;
    }
    
    const update = buildTransitionUpdateQuery(validationResult.data, id);
    const result = await client.query<TransitionRecordRow>(update.query, update.values);

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Transition record not found" }, { status: 404 });
    }
    
    const updatedTransition = result.rows[0];
    
    broadcastTransitionChange({
      action: 'update',
      actingUserId: session!.user!.id!,
      applicantId: currentTransition.applicantId,
      transition: updatedTransition,
    });
    
    await logAudit('AUDIT', `Transition record (ID: ${id}) was updated.`, 'API:Transitions:Update', actingUserId, { transitionId: id });
    return NextResponse.json(updatedTransition, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getTransitionRouteErrorMessage(error);
    console.error(`Failed to update transition record ${id}:`, error);
    await logAudit('ERROR', `Failed to update transition record (ID: ${id}). Error: ${errorMessage}`, 'API:Transitions:Update', actingUserId);
    return NextResponse.json({ message: "Error updating transition record", error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
  const idResult = resolveTransitionRouteId(request);
  if ('response' in idResult) {
    return idResult.response;
  }
  const { id } = idResult;
  
  const session = await auth();
  const actingUserId = session?.user?.id;
  const permission = await requireTransitionRoutePermission({ action: 'Delete', actingUserId, session });
  if ('response' in permission) {
    return permission.response;
  }
  
  const client: DbClient = await getPool().connect();
  try {
    const transitionToDelete = await fetchTransitionRecord(client, id);
    if (!transitionToDelete) {
      return NextResponse.json({ message: "Transition record not found" }, { status: 404 });
    }
    
    const ownershipResponse = await enforceTransitionOwnership({
      action: 'Delete',
      actingUserId: actingUserId!,
      hasGlobalPermission: permission.hasGlobalPermission,
      session,
      transition: transitionToDelete,
    });
    if (ownershipResponse) {
      return ownershipResponse;
    }
    
    const result = await client.query('DELETE FROM "TransitionRecord" WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Transition record not found" }, { status: 404 });
    }
    
    broadcastTransitionChange({
      action: 'delete',
      actingUserId: session!.user!.id!,
      applicantId: transitionToDelete.applicantId,
      transition: transitionToDelete,
    });
    
    await logAudit('AUDIT', `Transition record (ID: ${id}) was deleted.`, 'API:Transitions:Delete', actingUserId, { transitionId: id });
    return NextResponse.json({ message: "Transition record deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getTransitionRouteErrorMessage(error);
    console.error(`Failed to delete transition record ${id}:`, error);
    await logAudit('ERROR', `Failed to delete transition record (ID: ${id}). Error: ${errorMessage}`, 'API:Transitions:Delete', actingUserId);
    return NextResponse.json({ message: "Error deleting transition record", error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}

    
