export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { verifyApiToken } from '@/lib/auth';
import { handleCors } from '@/lib/cors';
import { readRequestJsonResult } from '@/lib/request-json';
import { getDefaultMatchCriteria } from '@/lib/systemSettings';

const positionImportSchema = z.object({
  positions: z.array(z.object({
    title: z.string().min(1),
    department: z.string().min(1),
    description: z.string().optional().nullable(),
    matchCriteria: z.string().optional().nullable(),
    isOpen: z.boolean(),
    positionLevel: z.string().optional().nullable(),
    custom_attributes: z.record(z.unknown()).optional().nullable(),
  }))
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: handleCors(req) });
  }

  if (user.role !== 'Admin' && !user.modulePermissions?.includes('POSITIONS_IMPORT')) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to import positions' }), { status: 403, headers: handleCors(req) });
  }

  // Get default match criteria from system settings
  const defaultMatchCriteria = await getDefaultMatchCriteria();

  const bodyResult = await readRequestJsonResult(req);
  if (!bodyResult.ok) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: handleCors(req) });
  }
  const body = bodyResult.value;

  const validationResult = positionImportSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid input', details: validationResult.error.flatten().fieldErrors }), { status: 400, headers: handleCors(req) });
  }

  const validatedData = validationResult.data;
  const positions = validatedData.positions;
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const position of positions) {
      try {
        // Check if position already exists (by title and department)
        const existingResult = await client.query(
          'SELECT id FROM "Position" WHERE title = $1 AND department = $2', 
          [position.title, position.department]
        );
        
        if (existingResult.rows.length > 0) {
          results.skipped++;
          continue;
        }

        // Insert new position
        const insertQuery = `
          INSERT INTO "Position" (
            id, title, department, description, "matchCriteria", "isOpen",
            "positionLevel", "customAttributes", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `;
        
        await client.query(insertQuery, [
          uuidv4(),
          position.title,
          position.department,
          position.description || null,
          (position.matchCriteria && position.matchCriteria.trim() !== '') ? position.matchCriteria : defaultMatchCriteria,
          position.isOpen,
          position.positionLevel || null,
          position.custom_attributes || {}
        ]);

        results.imported++;
      } catch (error) {
        results.errors.push(`Failed to import ${position.title}: ${(error as Error).message}`);
      }
    }

    await client.query('COMMIT');

    return new Response(JSON.stringify({
      message: 'Import completed',
      results
    }), { status: 200, headers: handleCors(req) });

  } catch (error) {
    await client.query('ROLLBACK');
    return new Response(JSON.stringify({ error: 'Error importing positions', details: (error as Error).message }), { status: 500, headers: handleCors(req) });
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: handleCors(req) });
  }

  // Return import template
  const template = {
    positions: [
      {
        title: "Software Engineer",
        department: "Engineering",
        description: "Full-stack development role",
        matchCriteria: "",
        isOpen: true,
        positionLevel: "Mid-level",
        custom_attributes: {}
      }
    ]
  };

  return new Response(JSON.stringify(template), {
    status: 200,
    headers: {
      ...handleCors(req),
      'Content-Type': 'application/json'
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 
