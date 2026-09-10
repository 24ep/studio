export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { broadcastApplicantUpdate, broadcastNotification } from '@/lib/simple-broadcaster';
import { getPool } from '@/lib/db';

import { auth } from '@/auth';
import { getJsonObject, getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const actingUserId = session?.user?.id;

    if (!actingUserId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await readRequestJsonObject(request); // Accept 'applicantId' from request for backward compatibility, but use 'targetApplicantId' internally
    const updates = getJsonObject(body, 'updates');
    const targetApplicantId = getJsonString(body, 'applicantId');

    if (!targetApplicantId || !updates) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Update Applicant in database
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Build update query dynamically
      const updateFields = Object.keys(updates).map((key, index) => `"${key}" = $${index + 2}`);
      const updateValues = Object.values(updates);
      
      const updateQuery = `
        UPDATE "Applicant" 
        SET ${updateFields.join(', ')}, "updatedAt" = NOW() 
        WHERE id = $1 
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [targetApplicantId, ...updateValues]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
      }
      
      const updatedApplicant = result.rows[0];
      await client.query('COMMIT');

      // Broadcast the update using simple SSE
      broadcastApplicantUpdate(updatedApplicant, actingUserId);
      
      // Send notification
      broadcastNotification(
        `Applicant ${updatedApplicant.name} updated successfully`, 
        'success', 
        actingUserId
      );

      return NextResponse.json({ 
        message: 'Applicant updated successfully',
        applicant: updatedApplicant 
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating Applicant:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
