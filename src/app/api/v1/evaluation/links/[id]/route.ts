import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { canManageEvaluationLink } from '@/lib/permissions'
import { readRequestJsonOrFallback } from '@/lib/request-json'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = (await params).id

    const link = await prisma.applicantEvaluationLink.findUnique({ where: { id } })
    if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check permission to manage the link
    const { canManage, reason } = canManageEvaluationLink(session.user, link.createdById, session.user.id)
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden', message: reason || 'Insufficient permissions' }, { status: 403 })
    }

    const body = await readRequestJsonOrFallback<{ requireLogin?: boolean }>(request, {})
    
    const updated = await prisma.applicantEvaluationLink.update({
      where: { id },
      data: {
        requireLogin: typeof body.requireLogin === 'boolean' ? body.requireLogin : link.requireLogin,
      },
    })

    return NextResponse.json({
      id: updated.id,
      requireLogin: updated.requireLogin,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: 'Internal Server Error', message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = (await params).id

    const link = await prisma.applicantEvaluationLink.findUnique({ where: { id } })
    if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check permission to manage the link
    const { canManage, reason } = canManageEvaluationLink(session.user, link.createdById, session.user.id)
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden', message: reason || 'Insufficient permissions' }, { status: 403 })
    }

    await prisma.applicantEvaluationLink.update({ where: { id }, data: { revokedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: 'Internal Server Error', message }, { status: 500 })
  }
}


