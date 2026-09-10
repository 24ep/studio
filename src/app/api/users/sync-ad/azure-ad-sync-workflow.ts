import { getPool } from '@/lib/db';
import { getGraphClient } from '@/lib/graphClient';
import { logAudit } from '@/lib/auditLog';
import { fetchAndUploadAvatar, fetchAzureADUsers } from './azure-ad-graph';
import {
  createAzureAdUsers,
  type AzureAdUserUpdateData,
  type ExistingAzureAdUserRow,
  getExistingUsersByAzureIdentity,
  markDeletedAzureAdUsers,
  syncDepartmentTeams,
  updateExistingAzureAdUsers,
} from './azure-ad-sync-database';
import type { GraphClientLike } from './azure-ad-graph';
import type { AzureAdSyncResults, AzureAdSyncStreamContext, AzureAdUserSyncData } from './azure-ad-sync-types';
import { buildAzureAdUserDataMap, getAzureAdDepartments } from './azure-ad-user-mapping';

const USER_PROCESSING_CHUNK_SIZE = 5;

export async function runAzureAdSyncStream(context: AzureAdSyncStreamContext) {
  const client = await getPool().connect();

  try {
    context.sendProgress('Connecting to Azure AD...');
    const graphClient = await getGraphClient();

    context.sendProgress('Fetching users from Azure AD...');
    const adUsers = await fetchAzureADUsers(graphClient);

    context.sendProgress(`Fetched ${adUsers.length} users from Azure AD. Processing...`);

    const results: AzureAdSyncResults = {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };
    const userDataMap = buildAzureAdUserDataMap(adUsers);

    if (userDataMap.size === 0) {
      context.sendResult({
        success: true,
        message: 'No enabled users found to sync',
        results,
      });
      return;
    }

    context.sendProgress('Syncing departments and teams...');
    const departmentToTeamIdMap = await syncDepartmentTeams(
      client,
      getAzureAdDepartments(userDataMap)
    );
    const existingUsers = await getExistingUsersByAzureIdentity(client, userDataMap);

    context.sendProgress('Processing users and syncing avatars...');
    const { usersToCreate, usersToUpdate } = await prepareAzureAdUserMutations({
      graphClient,
      userDataMap,
      departmentToTeamIdMap,
      existingUsers,
      results,
      sendProgress: context.sendProgress,
    });

    results.updated = await updateExistingAzureAdUsers(
      client,
      usersToUpdate,
      context.session,
      context.sendProgress
    );
    results.created = await createAzureAdUsers(
      client,
      usersToCreate,
      context.session,
      context.sendProgress
    );

    await markDeletedAzureAdUsers(
      client,
      userDataMap,
      results,
      context.session,
      context.sendProgress
    );

    await finalizeAzureAdSync(context, results, adUsers.length);
  } catch (error) {
    await handleAzureAdSyncError(context, error);
  } finally {
    client.release();
  }
}

async function prepareAzureAdUserMutations({
  graphClient,
  userDataMap,
  departmentToTeamIdMap,
  existingUsers,
  results,
  sendProgress,
}: {
  graphClient: GraphClientLike;
  userDataMap: Map<string, AzureAdUserSyncData>;
  departmentToTeamIdMap: Map<string, string>;
  existingUsers: {
    byEmail: Map<string, ExistingAzureAdUserRow>;
    byOid: Map<string, ExistingAzureAdUserRow>;
  };
  results: AzureAdSyncResults;
  sendProgress: (message: string) => void;
}) {
  const usersToUpdate: AzureAdUserUpdateData[] = [];
  const usersToCreate: AzureAdUserSyncData[] = [];
  const userEntries = Array.from(userDataMap.entries());

  for (let i = 0; i < userEntries.length; i += USER_PROCESSING_CHUNK_SIZE) {
    const chunk = userEntries.slice(i, i + USER_PROCESSING_CHUNK_SIZE);
    sendProgress(`Processing users ${Math.min(i + USER_PROCESSING_CHUNK_SIZE, userEntries.length)} of ${userEntries.length}...`);

    await Promise.all(chunk.map(async ([email, userData]) => {
      try {
        const existingUser = existingUsers.byEmail.get(email) || existingUsers.byOid.get(userData.azureOid);
        const teamId = userData.department ? departmentToTeamIdMap.get(userData.department) : null;
        let avatarUrl = existingUser?.avatarUrl;

        if ((!existingUser || !existingUser.avatarUrl) && graphClient) {
          avatarUrl = await fetchAndUploadAvatar(graphClient, userData.azureOid) || avatarUrl;
        }

        if (existingUser) {
          usersToUpdate.push({
            id: existingUser.id,
            ...userData,
            userTeamId: teamId,
            avatarUrl,
          });
        } else if (userData.accountEnabled) {
          usersToCreate.push({
            ...userData,
            userTeamId: teamId,
            avatarUrl,
          });
        }
      } catch (error) {
        results.errors.push({
          email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }));
  }

  return { usersToCreate, usersToUpdate };
}

async function finalizeAzureAdSync(
  context: AzureAdSyncStreamContext,
  results: AzureAdSyncResults,
  totalAdUsers: number
) {
  context.sendProgress('Sync completed successfully.');

  await logAudit(
    'AUDIT',
    `Azure AD user sync completed by ${context.session.user.email}. Created: ${results.created}, Updated: ${results.updated}, Deleted: ${results.deleted}, Errors: ${results.errors.length}`,
    'API:Users:SyncAD',
    context.session.user.id,
    {
      created: results.created,
      updated: results.updated,
      deleted: results.deleted,
      errorCount: results.errors.length,
      totalAdUsers,
    }
  );

  context.sendResult({
    success: true,
    message: `Sync completed. Created: ${results.created}, Updated: ${results.updated}, Deleted from AD: ${results.deleted}, Errors: ${results.errors.length}`,
    results,
  });
}

async function handleAzureAdSyncError(context: AzureAdSyncStreamContext, error: unknown) {
  console.error('[AD SYNC] Error:', error);

  await logAudit(
    'ERROR',
    `Azure AD user sync failed by ${context.session.user.email}. Error: ${error instanceof Error ? error.message : String(error)}`,
    'API:Users:SyncAD',
    context.session.user.id
  );

  context.sendResult({
    success: false,
    message: 'Failed to sync users from Azure AD',
    error: error instanceof Error ? error.message : String(error),
  });
}
