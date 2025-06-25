// src/lib/db.ts
import { Pool } from 'pg';
let pool = null;
export function getPool() {
    if (!process.env.DATABASE_URL) {
        throw new Error('FATAL: DATABASE_URL environment variable is not set.');
    }
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
        pool.on('error', (err, client) => {
            console.error('Unexpected error on idle PostgreSQL client', err);
            process.exit(-1);
        });
    }
    return pool;
}
// Returns a deduplicated array of all permissions for a user (direct + group)
export async function getMergedUserPermissions(userId) {
    var _a, _b;
    const client = await getPool().connect();
    try {
        // Get direct permissions
        const userRes = await client.query('SELECT "modulePermissions" FROM "User" WHERE id = $1', [userId]);
        const direct = (((_a = userRes.rows[0]) === null || _a === void 0 ? void 0 : _a.modulePermissions) || []);
        // Get group permissions
        const groupRes = await client.query(`
      SELECT array_agg(DISTINCT perm) AS group_permissions
      FROM (
        SELECT unnest(permissions) AS perm
        FROM "UserGroup" ug
        JOIN "User_UserGroup" uug ON ug.id = uug."groupId"
        WHERE uug."userId" = $1
      ) AS perms
    `, [userId]);
        const group = (((_b = groupRes.rows[0]) === null || _b === void 0 ? void 0 : _b.group_permissions) || []);
        // Merge and deduplicate
        return Array.from(new Set([...(direct || []), ...(group || [])]));
    }
    finally {
        client.release();
    }
}
