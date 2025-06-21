// src/lib/apiUtils.ts
import pool from './db';
import type { Position, RecruitmentStage, Candidate, UserProfile } from './types';
import { getRedisClient, CACHE_KEY_POSITIONS, CACHE_EXPIRY_SECONDS_POSITIONS, CACHE_KEY_RECRUITMENT_STAGES, CACHE_EXPIRY_SECONDS_STAGES, CACHE_KEY_USERS, CACHE_EXPIRY_SECONDS_USERS } from './redis';


export async function fetchAllPositionsDb(): Promise<Position[]> {
  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      const cachedData = await redisClient.get(CACHE_KEY_POSITIONS);
      if (cachedData) {
        console.log('Positions fetched from Redis cache.');
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error('Error fetching positions from Redis cache:', cacheError);
    }
  }

  try {
    console.log('Fetching positions from DB...');
    const result = await pool.query('SELECT id, title, department, description, "isOpen", position_level, custom_attributes, "createdAt", "updatedAt" FROM "Position" ORDER BY title ASC');
    const positionsFromDb = result.rows.map(row => ({
      ...row,
      custom_attributes: row.custom_attributes || {},
    }));

    if (redisClient) {
      try {
        await redisClient.set(CACHE_KEY_POSITIONS, JSON.stringify(positionsFromDb), { EX: CACHE_EXPIRY_SECONDS_POSITIONS });
        console.log('Positions cached in Redis.');
      } catch (cacheError) {
        console.error('Error caching positions in Redis:', cacheError);
      }
    }
    return positionsFromDb;
  } catch (error) {
    console.error("Error fetching all positions from DB:", error);
    throw error;
  }
}

export async function fetchAllRecruitmentStagesDb(): Promise<RecruitmentStage[]> {
  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      const cachedData = await redisClient.get(CACHE_KEY_RECRUITMENT_STAGES);
      if (cachedData) {
        console.log('Recruitment stages fetched from Redis cache.');
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error('Error fetching recruitment stages from Redis cache:', cacheError);
    }
  }
  
  try {
    console.log('Fetching recruitment stages from DB...');
    const result = await pool.query('SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC');
    const stagesFromDb = result.rows;

    if (redisClient) {
      try {
        await redisClient.set(CACHE_KEY_RECRUITMENT_STAGES, JSON.stringify(stagesFromDb), { EX: CACHE_EXPIRY_SECONDS_STAGES });
        console.log('Recruitment stages cached in Redis.');
      } catch (cacheError) {
        console.error('Error caching recruitment stages in Redis:', cacheError);
      }
    }
    return stagesFromDb;
  } catch (error) {
    console.error("Error fetching all recruitment stages from DB:", error);
    throw error;
  }
}

export async function fetchAllUsersDb(filterRole?: UserProfile['role']): Promise<UserProfile[]> {
  const redisClient = await getRedisClient();
  // Don't cache filtered user lists, only cache the full list
  const shouldCache = !filterRole && redisClient;

  if (shouldCache) {
    try {
      const cachedData = await redisClient.get(CACHE_KEY_USERS);
      if (cachedData) {
        console.log('All users fetched from Redis cache.');
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error('Error fetching users from Redis cache:', cacheError);
    }
  }

  try {
    console.log(`Fetching users from DB (Role filter: ${filterRole || 'None'})...`);
    let query = 'SELECT id, name, email, role, "avatarUrl", "dataAiHint" FROM "User"';
    const queryParams = [];
    if (filterRole) {
      query += ' WHERE role = $1';
      queryParams.push(filterRole);
    }
    query += ' ORDER BY name ASC';
    const result = await pool.query(query, queryParams);
    const usersFromDb = result.rows.map(user => ({
      ...user,
      modulePermissions: user.modulePermissions || [],
      groups: user.groups || [],
    }));

    if (shouldCache) {
       try {
        await redisClient.set(CACHE_KEY_USERS, JSON.stringify(usersFromDb), { EX: CACHE_EXPIRY_SECONDS_USERS });
        console.log('All users cached in Redis.');
      } catch (cacheError) {
        console.error('Error caching users in Redis:', cacheError);
      }
    }

    return usersFromDb;
  } catch (error) {
    console.error(`Error fetching users from DB (role: ${filterRole || 'all'}):`, error);
    throw error;
  }
}


// Fetch initial candidates for dashboard or other general views
// This is a simplified version. For full filtering like in /api/candidates, more complex logic is needed.
export async function fetchInitialDashboardCandidatesDb(limit: number = 10): Promise<Candidate[]> {
  try {
    const query = `
      SELECT
        c.id, c.name, c.email, c.phone, c."avatarUrl", c."dataAiHint", c."resumePath", c."parsedData", c.custom_attributes,
        c."positionId", c."fitScore", c.status, c."applicationDate",
        c."recruiterId", c."createdAt", c."updatedAt",
        p.title as "positionTitle", p.department as "positionDepartment", p.position_level as "positionLevel",
        rec.name as "recruiterName"
        -- Note: transitionHistory is omitted here for dashboard performance, fetch on detail page
      FROM "Candidate" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" rec ON c."recruiterId" = rec.id
      ORDER BY c."applicationDate" DESC, c."createdAt" DESC
      LIMIT $1;
    `;
    const result = await pool.query(query, [limit]);
    return result.rows.map(row => ({
      ...row,
      parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
      custom_attributes: row.custom_attributes || {},
      position: row.positionId ? { id: row.positionId, title: row.positionTitle, department: row.department, position_level: row.positionLevel } : null,
      recruiter: row.recruiterId ? { id: row.recruiterId, name: row.recruiterName, email: null } : null,
      transitionHistory: [], // Default to empty for dashboard list
    }));
  } catch (error) {
    console.error("Error fetching initial dashboard candidates from DB:", error);
    throw error;
  }
}
