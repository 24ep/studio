import { v4 as uuidv4 } from 'uuid';

import type { DbClient } from '@/lib/db';

import type { UserTeamRow } from './azure-ad-sync-database-types';

export async function syncDepartmentTeams(client: DbClient, departmentNames: string[]) {
  const departmentToTeamIdMap = new Map<string, string>();
  if (departmentNames.length === 0) {
    return departmentToTeamIdMap;
  }

  const existingTeamsResult = await client.query<UserTeamRow>(
    'SELECT id, name FROM "UserTeam" WHERE name = ANY($1::text[])',
    [departmentNames]
  );

  for (const team of existingTeamsResult.rows) {
    departmentToTeamIdMap.set(team.name, team.id);
  }

  const missingDepartments = departmentNames.filter(departmentName => !departmentToTeamIdMap.has(departmentName));
  if (missingDepartments.length === 0) {
    return departmentToTeamIdMap;
  }

  await client.query('BEGIN');
  try {
    for (const departmentName of missingDepartments) {
      const newTeamId = uuidv4();
      await client.query(
        'INSERT INTO "UserTeam" (id, name, description, "is_active", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [newTeamId, departmentName, `Synced from Azure AD Department: ${departmentName}`, true]
      );
      departmentToTeamIdMap.set(departmentName, newTeamId);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user teams for departments:', error);
  }

  return departmentToTeamIdMap;
}
