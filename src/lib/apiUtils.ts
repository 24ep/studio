// src/lib/apiUtils.ts
import { prisma } from './prisma';
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
    const positionsFromDb = await prisma.position.findMany({
      orderBy: {
        title: 'asc',
      },
    });

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
    const stagesFromDb = await prisma.recruitmentStage.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

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
    const usersFromDb = await prisma.user.findMany({
      where: filterRole ? { role: filterRole } : {},
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        // Ensure you add any other fields needed by UserProfile that exist on the User model
      },
    });

    if (shouldCache) {
       try {
        await redisClient.set(CACHE_KEY_USERS, JSON.stringify(usersFromDb), { EX: CACHE_EXPIRY_SECONDS_USERS });
        console.log('All users cached in Redis.');
      } catch (cacheError) {
        console.error('Error caching users in Redis:', cacheError);
      }
    }

    return usersFromDb.map(u => ({ ...u, avatarUrl: u.image, dataAiHint: null, modulePermissions: [], groups: [] }));
  } catch (error) {
    console.error(`Error fetching users from DB (role: ${filterRole || 'all'}):`, error);
    throw error;
  }
}


// Fetch initial candidates for dashboard or other general views
// This is a simplified version. For full filtering like in /api/candidates, more complex logic is needed.
export async function fetchInitialDashboardCandidatesDb(limit: number = 10): Promise<Candidate[]> {
  try {
    const candidates = await prisma.candidate.findMany({
      take: limit,
      orderBy: [
        { applicationDate: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        position: true,
        recruiter: true,
      },
    });
    
    return candidates as Candidate[];
  } catch (error) {
    console.error("Error fetching initial dashboard candidates from DB:", error);
    throw error;
  }
}
