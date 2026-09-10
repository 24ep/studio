export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';
import { auth } from '@/auth';
/**
 * @openapi
 * /api/auth/validate-session:
 *   get:
 *     summary: Validate current user session
 *     description: Checks if the current user session is valid and the user exists in the database
 *     responses:
 *       200:
 *         description: Session is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Session is invalid or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid user session. Please sign in again."
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      
      return NextResponse.json({ 
        valid: false, 
        error: 'No session found' 
      }, { status: 401 });
    }

    if (!session.user?.id) {
   
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid session - no user ID' 
      }, { status: 401 });
    }

    const validation = await validateUserSession(session);
    
    if (!validation.isValid) {
     
      return NextResponse.json({ 
        valid: false, 
        error: validation.error 
      }, { status: 401 });
    }

    
    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      }
    });
  } catch (error) {
    
    return NextResponse.json({ 
      valid: false, 
      error: 'Internal server error during session validation' 
    }, { status: 500 });
  }
} 
