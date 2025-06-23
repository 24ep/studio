// src/lib/apiUtils.ts
import { getPool } from './db';
import type { Position, RecruitmentStage, Candidate, UserProfile } from './types';
import { getRedisClient, CACHE_KEY_POSITIONS, CACHE_EXPIRY_SECONDS_POSITIONS, CACHE_KEY_RECRUITMENT_STAGES, CACHE_EXPIRY_SECONDS_STAGES, CACHE_KEY_USERS, CACHE_EXPIRY_SECONDS_USERS } from './redis';

export async function fetchAllPositionsDb(): Promise<Position[]> {
  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      const cachedData = await redisClient.get(CACHE_KEY_POSITIONS);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error('Error fetching positions from Redis cache:', cacheError);
    }
  }

  const pool = getPool();
  try {
    const result = await pool.query('SELECT * FROM "positions" ORDER BY title ASC');
    const positionsFromDb = result.rows;

    if (redisClient) {
      try {
        await redisClient.set(CACHE_KEY_POSITIONS, JSON.stringify(positionsFromDb), { EX: CACHE_EXPIRY_SECONDS_POSITIONS });
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
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error('Error fetching recruitment stages from Redis cache:', cacheError);
    }
  }

  const pool = getPool();
  try {
    const result = await pool.query('SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC');
    const stagesFromDb = result.rows;

    if (redisClient) {
      try {
        await redisClient.set(CACHE_KEY_RECRUITMENT_STAGES, JSON.stringify(stagesFromDb), { EX: CACHE_EXPIRY_SECONDS_STAGES });
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
  const shouldCache = !filterRole && redisClient;

  if (shouldCache) {
    try {
      const cachedData = await redisClient.get(CACHE_KEY_USERS);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error('Error fetching users from Redis cache:', cacheError);
    }
  }

  const pool = getPool();
  try {
    let query = 'SELECT id, name, email, role, image as "avatarUrl" FROM "User"';
    const queryParams = [];
    if (filterRole) {
      query += ' WHERE role = $1';
      queryParams.push(filterRole);
    }
    query += ' ORDER BY name ASC';
    const result = await pool.query(query, queryParams);
    const usersFromDb = result.rows;

    if (shouldCache) {
       try {
        await redisClient.set(CACHE_KEY_USERS, JSON.stringify(usersFromDb), { EX: CACHE_EXPIRY_SECONDS_USERS });
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

export async function fetchInitialDashboardCandidatesDb(limit: number = 10): Promise<Candidate[]> {
  const pool = getPool();
  try {
    const query = `
      SELECT id, name, email, phone, "positionId", "recruiterId", "fitScore", status, "applicationDate", "parsedData", "customAttributes", "resumePath", "createdAt", "updatedAt"
      FROM "candidates"
      ORDER BY "createdAt" DESC
      LIMIT $1;
    `;
    const result = await pool.query(query, [limit]);
    return result.rows.map((row: Candidate) => ({
      ...row,
    }));
  } catch (error) {
    console.error("Error fetching initial dashboard candidates from DB:", error);
    throw error;
  }
}