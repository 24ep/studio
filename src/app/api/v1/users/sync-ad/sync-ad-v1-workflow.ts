import { getPool } from '@/lib/db';
import {
  classifyV1AzureAdUsers,
  createV1AzureAdUsers,
  fetchExistingV1AzureAdUsers,
  updateExistingV1AzureAdUsers,
} from './sync-ad-v1-data';
import { fetchV1AzureAdUsers, getV1GraphClient } from './sync-ad-v1-graph';
import { buildV1AzureAdUserDataMap } from './sync-ad-v1-mapping';
import type { V1AzureAdSyncResults } from './sync-ad-v1-types';

export async function runV1AzureAdSync() {
  const client = await getPool().connect();

  try {
    const graphClient = await getV1GraphClient();
    const adUsers = await fetchV1AzureAdUsers(graphClient);
    const results: V1AzureAdSyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };
    const userDataMap = buildV1AzureAdUserDataMap(adUsers);

    if (userDataMap.size === 0) {
      return {
        adUserCount: adUsers.length,
        syncableUserCount: userDataMap.size,
        results,
      };
    }

    const existingUsers = await fetchExistingV1AzureAdUsers(client, userDataMap);
    const { usersToUpdate, usersToCreate } = classifyV1AzureAdUsers(userDataMap, existingUsers, results);

    results.updated = await updateExistingV1AzureAdUsers(client, usersToUpdate);
    results.created = await createV1AzureAdUsers(client, usersToCreate);

    return {
      adUserCount: adUsers.length,
      syncableUserCount: userDataMap.size,
      results,
    };
  } finally {
    client.release();
  }
}
