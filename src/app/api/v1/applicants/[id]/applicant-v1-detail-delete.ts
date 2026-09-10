import { type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import {
  SimpleErrorHandler,
  createInternalServerError,
  createNotFoundError,
} from '@/lib/errors';
import { logAudit } from '@/lib/auditLog';
import { requireV1ApplicantDeleteUser } from './applicant-v1-detail-auth';
import { type V1ApplicantDetailContext } from './applicant-v1-detail-schema';

export async function handleDeleteV1Applicant(req: NextRequest, { params }: V1ApplicantDetailContext) {
  const authorization = await requireV1ApplicantDeleteUser(req);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  const user = authorization.user;
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const existingResult = await client.query('SELECT * FROM "Applicant" WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('Applicant not found'));
    }

    await client.query('DELETE FROM "Applicant" WHERE id = $1', [id]);
    await client.query('COMMIT');

    const actingUserName = (user.name || user.email || user.id || 'System') as string;
    await logAudit('AUDIT', `Applicant '${existingResult.rows[0].name}' deleted by ${actingUserName}.`, 'API:V1:Applicants:Delete', user.id, { applicantId: id });
    return SimpleErrorHandler.createSuccessResponse(req, { message: 'Applicant deleted successfully' }, 200);
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logAudit('ERROR', `Failed to delete Applicant (ID: ${id}) by ${user?.name || 'Unknown'}. Error: ${errorMessage}`, 'API:V1:Applicants:Delete', user?.id, { applicantId: id, error: errorMessage });
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error deleting Applicant: ${errorMessage}`));
  } finally {
    client.release();
  }
}
