import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, validateUserSession } from '@/lib/auth';

export const dynamic = "force-dynamic";

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
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('[SESSION VALIDATION] No session found');
      return NextResponse.json({ 
        valid: false, 
        error: 'No session found' 
      }, { status: 401 });
    }

    if (!session.user?.id) {
      console.log('[SESSION VALIDATION] Session exists but no user ID found');
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid session - no user ID' 
      }, { status: 401 });
    }

    const validation = await validateUserSession(session);
    
    if (!validation.isValid) {
      console.log(`[SESSION VALIDATION] Session validation failed for user ${validation.userId}: ${validation.error}`);
      return NextResponse.json({ 
        valid: false, 
        error: validation.error 
      }, { status: 401 });
    }

    console.log(`[SESSION VALIDATION] Session validated successfully for user ${session.user.id}`);
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
    console.error('[SESSION VALIDATION] Unexpected error during session validation:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Internal server error during session validation' 
    }, { status: 500 });
  }
} 