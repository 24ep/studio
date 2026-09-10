import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';

export async function handleGetImportedPositions() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const client = await getPool().connect();
  try {
    const positionsResult = await client.query(`
      SELECT * FROM "Position"
      ORDER BY "createdAt" DESC;
    `);
    return NextResponse.json({ data: positionsResult.rows }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in /api/positions/import:', error);
    return NextResponse.json({ message: 'Error fetching positions', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
