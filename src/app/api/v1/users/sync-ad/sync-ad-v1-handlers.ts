import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { requireV1AzureAdSyncAccess } from './sync-ad-v1-auth';
import { runV1AzureAdSync } from './sync-ad-v1-workflow';

export async function handleV1AzureAdSync(_request: NextRequest) {
  const access = await requireV1AzureAdSyncAccess();
  if (!access.ok) {
    return access.response;
  }

  try {
    const { adUserCount, syncableUserCount, results } = await runV1AzureAdSync();

    if (syncableUserCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No enabled users found to sync',
        data: results,
      });
    }

    await logAudit(
      'AUDIT',
      `Azure AD user sync completed by ${access.session.user.email}. Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`,
      'API:V1:Users:SyncAD',
      access.session.user.id,
      {
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        errorCount: results.errors.length,
        totalAdUsers: adUserCount,
      },
    );

    return NextResponse.json({
      success: true,
      message: `Sync completed. Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`,
      data: results,
    });
  } catch (error) {
    console.error('[V1 AD SYNC] Error:', error);
    await logAudit(
      'ERROR',
      `Azure AD user sync failed by ${access.session.user.email}. Error: ${error instanceof Error ? error.message : String(error)}`,
      'API:V1:Users:SyncAD',
      access.session.user.id,
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync users from Azure AD',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
