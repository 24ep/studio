// src/app/api/system/initial-setup-check/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = "force-dynamic";

async function checkDatabaseConnection() {
    let client;
    try {
        client = await getPool().connect();
        await client.query('SELECT 1');
        return { ok: true, error: null };
    } catch (error: any) {
        return { ok: false, error: error.message };
    } finally {
        if (client) client.release();
    }
}

async function checkAdminUserExists() {
    let client;
    try {
        client = await getPool().connect();
        const result = await client.query(`SELECT 1 FROM "User" WHERE role = 'Admin' LIMIT 1`);
        return { ok: (result.rowCount ?? 0) > 0, error: null };
    } catch (error: any) {
        if (error.code === '42P01') { // table "User" does not exist
            return { ok: false, error: 'User table not found. Schema might not be initialized.' };
        }
        return { ok: false, error: error.message };
    } finally {
        if (client) client.release();
    }
}

export async function GET(request: NextRequest) {
    const dbStatus = await checkDatabaseConnection();
    let adminStatus = { ok: false, error: 'Database not connected' };

    if (dbStatus.ok) {
        adminStatus = await checkAdminUserExists();
    }

    const allOk = dbStatus.ok && adminStatus.ok;

    return NextResponse.json({
        database: dbStatus,
        adminUser: adminStatus,
        allOk: allOk
    });
}
