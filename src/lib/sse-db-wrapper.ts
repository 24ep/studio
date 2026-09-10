// SSE Database Connection Wrapper
// Prevents connection leaks and provides timeout protection for SSE endpoints

import type { QueryResultRow } from 'pg';
import { getPool, type DbClient } from '@/lib/db';

export interface SSEConnectionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  connectionTime?: number;
}

export type SSEUserData = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

type SSEUserRow = QueryResultRow & SSEUserData;

/**
 * Safely executes a database operation with automatic connection management
 * and timeout protection for SSE endpoints
 */
export async function withSSEDbConnection<T>(
  operation: (client: DbClient) => Promise<T>,
  timeoutMs: number = 5000
): Promise<SSEConnectionResult<T>> {
  const startTime = Date.now();
  let client: DbClient | null = null;
  
  try {
    // Get connection with timeout
    const connectionPromise = getPool().connect();
    const connectionTimeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs)
    );
    
    client = await Promise.race([connectionPromise, connectionTimeoutPromise]);
    
    // Execute operation with timeout
    const operationPromise = operation(client);
    const operationTimeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
    );
    
    const data = await Promise.race([operationPromise, operationTimeoutPromise]);
    
    return {
      success: true,
      data: data as T,
      connectionTime: Date.now() - startTime
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.error('[SSE DB Wrapper] Database operation failed:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      connectionTime: Date.now() - startTime
    };
    
  } finally {
    // Always release the connection
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('[SSE DB Wrapper] Error releasing database client:', releaseError);
      }
    }
  }
}

/**
 * Quick database health check for SSE endpoints
 */
export async function checkSSEDatabaseHealth(): Promise<{
  healthy: boolean;
  error?: string;
  connectionTime?: number;
  poolStats?: {
    total: number;
    idle: number;
    waiting: number;
  };
}> {
  const result = await withSSEDbConnection(async (client) => {
    // Simple health check query
    const res = await client.query('SELECT 1 as health_check');
    return res.rows[0];
  }, 3000);
  
  if (result.success) {
    const pool = getPool();
    return {
      healthy: true,
      connectionTime: result.connectionTime,
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } else {
    return {
      healthy: false,
      error: result.error,
      connectionTime: result.connectionTime
    };
  }
}

/**
 * Validates user session with database connection protection
 */
export async function validateSSEUserSession(userId: string): Promise<{
  valid: boolean;
  error?: string;
  userData?: SSEUserData;
}> {
  if (!userId) {
    return { valid: false, error: 'No user ID provided' };
  }
  
  const result = await withSSEDbConnection(async (client) => {
    // Quick user validation query
    const res = await client.query<SSEUserRow>(
      'SELECT id, name, email, role FROM "User" WHERE id = $1 LIMIT 1',
      [userId]
    );
    return res.rows[0] || null;
  }, 5000);
  
  if (result.success) {
    if (result.data) {
      return { valid: true, userData: result.data };
    } else {
      return { valid: false, error: 'User not found' };
    }
  } else {
    return { valid: false, error: result.error };
  }
}
