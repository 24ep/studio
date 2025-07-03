import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { verifyApiToken } from '@/lib/auth';
import { handleCors } from '@/lib/cors';

const updatePositionSchema = z.object({
  title: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isOpen: z.boolean().optional(),
  position_level: z.string().optional().nullable(),
  custom_attributes: z.record(z.any()).optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { id } = params;
  const client = await getPool().connect();
  try {
    const query = 'SELECT id, title, department, description, "isOpen", position_level, "customAttributes", "createdAt", "updatedAt" FROM "Position" WHERE id = $1';
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Position not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const position = result.rows[0];
    return new Response(JSON.stringify({
      ...position,
      custom_attributes: position.customAttributes || {},
    }), { status: 200, headers: handleCors(req) });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error fetching position', details: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  if (!user || (user.role !== 'Admin' && !user.modulePermissions?.includes('POSITIONS_MANAGE'))) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const { id } = params;
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const validationResult = updatePositionSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid input', details: validationResult.error.flatten().fieldErrors }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const { title, department, description, isOpen, position_level, custom_attributes } = validationResult.data;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const positionExistsQuery = 'SELECT id FROM "Position" WHERE id = $1';
    const existingResult = await client.query(positionExistsQuery, [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return new Response(JSON.stringify({ error: 'Position not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const updateQuery = `
      UPDATE "Position" 
      SET title = $1, department = $2, description = $3, "isOpen" = $4, 
          position_level = $5, "customAttributes" = $6, "updatedAt" = NOW()
      WHERE id = $7
      RETURNING *;
    `;
    const updateResult = await client.query(updateQuery, [
      title, department, description, isOpen, position_level, custom_attributes || {}, id
    ]);
    await client.query('COMMIT');
    const updatedPosition = updateResult.rows[0];
    return new Response(JSON.stringify({
      message: 'Position updated successfully',
      position: {
        ...updatedPosition,
        custom_attributes: updatedPosition.customAttributes || {},
      }
    }), { status: 200, headers: handleCors(req) });
  } catch (error) {
    await client.query('ROLLBACK');
    return new Response(JSON.stringify({ error: 'Error updating position', details: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  if (!user || (user.role !== 'Admin' && !user.modulePermissions?.includes('POSITIONS_MANAGE'))) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const { id } = params;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const currentPosition = await client.query('SELECT * FROM "Position" WHERE id = $1', [id]);
    if (currentPosition.rows.length === 0) {
      await client.query('ROLLBACK');
      return new Response(JSON.stringify({ error: 'Position not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    await client.query('DELETE FROM "Position" WHERE id = $1', [id]);
    await client.query('COMMIT');
    return new Response(JSON.stringify({ message: 'Position deleted successfully' }), { status: 200, headers: handleCors(req) });
  } catch (error) {
    await client.query('ROLLBACK');
    return new Response(JSON.stringify({ error: 'Error deleting position', details: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 