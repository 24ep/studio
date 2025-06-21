// src/app/api/auth/change-password/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { logAudit } from '@/lib/auditLog';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters" }),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized: No active session" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = changePasswordSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = validationResult.data;
  const userId = session.user.id;

  try {
    const userFromDb = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userFromDb || !userFromDb.password) {
      await logAudit('ERROR', `User (ID: ${userId}) attempted password change but was not found in DB or has no password set.`, 'Auth:ChangePassword', userId);
      return NextResponse.json({ message: "User not found or cannot change password." }, { status: 404 });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userFromDb.password);

    if (!isCurrentPasswordValid) {
      await logAudit('WARN', `User '${userFromDb.email}' (ID: ${userId}) failed password change attempt: Incorrect current password.`, 'Auth:ChangePassword', userId);
      return NextResponse.json({ message: "Incorrect current password." }, { status: 400 });
    }
    
    if (currentPassword === newPassword) {
        return NextResponse.json({ message: "New password cannot be the same as the current password." }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    await logAudit('AUDIT', `User '${userFromDb.email}' (ID: ${userId}) successfully changed their password.`, 'Auth:ChangePassword', userId);
    return NextResponse.json({ message: "Password changed successfully." }, { status: 200 });

  } catch (error) {
    console.error("Error changing password:", error);
    await logAudit('ERROR', `Error changing password for user (ID: ${userId}). Error: ${(error as Error).message}`, 'Auth:ChangePassword', userId);
    return NextResponse.json({ message: "Error changing password", error: (error as Error).message }, { status: 500 });
  }
}
