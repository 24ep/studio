import { NextRequest } from 'next/server';
import { getPool, getMergedUserPermissions } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { handleCors } from '@/lib/cors';

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const { email, password } = body;
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!process.env.NEXTAUTH_SECRET) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: NEXTAUTH_SECRET is not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const client = await getPool().connect();
  try {
    const result = await client.query('SELECT * FROM "User" WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        const mergedPermissions = await getMergedUserPermissions(user.id);
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role,
            modulePermissions: mergedPermissions
          },
          process.env.NEXTAUTH_SECRET,
          { expiresIn: '1h' }
        );
        return new Response(JSON.stringify({ success: true, token, user: { id: user.id, email: user.email, role: user.role, modulePermissions: mergedPermissions } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error during authentication', details: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 