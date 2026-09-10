import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { employeeContext } from '@/lib/privacy-support';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { getServiceDeskCategories } from '@/lib/service-desk-categories';

const categorySchema = z.object({
  id: z.string().uuid().nullable(),
  key: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
  label: z.string().trim().min(1).max(80),
  isActive: z.boolean(),
  aiEnabled: z.boolean(),
  systemPrompt: z.string().trim().max(12000),
  sortOrder: z.number().int().min(0).max(100000),
  assigneeIds: z.array(z.string().uuid()).max(100),
}).strict();

const saveSchema = z.object({
  categories: z.array(categorySchema).min(1).max(100),
}).strict().superRefine((value, context) => {
  const keys = value.categories.map(category => category.key);
  if (new Set(keys).size !== keys.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['categories'], message: 'Category keys must be unique.' });
  }
});

async function requireSettings(permission: 'SYSTEM_SETTINGS_VIEW' | 'SYSTEM_SETTINGS_EDIT') {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user, permission)) return null;
  const employee = await employeeContext(session.user);
  return { user: session.user, companyId: employee.companyId };
}

async function listHrUsers(companyId: string | null, currentUserId: string) {
  return prisma.$queryRawUnsafe<Array<{ id: string; name: string; email: string; role: string }>>(
    `SELECT DISTINCT user_account.id, user_account.name, user_account.email, user_account.role
       FROM "User" user_account
       LEFT JOIN hr_employees employee ON employee.user_id = user_account.id
      WHERE user_account.is_active = true
        AND (user_account.role = 'Admin' OR 'HR_PEOPLE_MANAGE' = ANY(user_account.module_permissions))
        AND ($1::uuid IS NULL OR employee.company_id = $1::uuid OR user_account.id = $2::uuid)
      ORDER BY user_account.name, user_account.email`,
    companyId,
    currentUserId,
  );
}

export async function GET() {
  const context = await requireSettings('SYSTEM_SETTINGS_VIEW');
  if (!context) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const [categories, hrUsers] = await Promise.all([
    getServiceDeskCategories(context.companyId, true),
    listHrUsers(context.companyId, context.user.id),
  ]);
  const categoryIds = categories.map(category => category.id).filter((id): id is string => Boolean(id));
  const documents = categoryIds.length ? await prisma.$queryRawUnsafe<Array<{
    id: string;
    categoryId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    status: string;
    chunkCount: number;
    updatedAt: Date;
  }>>(
    `SELECT id, category_id AS "categoryId", file_name AS "fileName", mime_type AS "mimeType",
            size_bytes AS "sizeBytes", status, chunk_count AS "chunkCount", updated_at AS "updatedAt"
       FROM service_desk_knowledge_documents
      WHERE category_id = ANY($1::uuid[])
      ORDER BY updated_at DESC, file_name`,
    categoryIds,
  ) : [];
  return NextResponse.json({
    categories: categories.map(category => ({
      ...category,
      knowledgeDocuments: documents.filter(document => document.categoryId === category.id),
    })),
    hrUsers,
  });
}

export async function PUT(request: NextRequest) {
  const context = await requireSettings('SYSTEM_SETTINGS_EDIT');
  if (!context) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Review the category names and HR assignments.' }, { status: 400 });
  }

  const hrUsers = await listHrUsers(context.companyId, context.user.id);
  const allowedAssignees = new Set(hrUsers.map(user => user.id));
  if (parsed.data.categories.some(category => category.assigneeIds.some(id => !allowedAssignees.has(id)))) {
    return NextResponse.json({ message: 'One or more selected users are not eligible HR users.' }, { status: 400 });
  }

  await prisma.$transaction(async transaction => {
    const existing = await transaction.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM service_desk_categories WHERE company_id IS NOT DISTINCT FROM $1::uuid`,
      context.companyId,
    );
    const existingIds = new Set(existing.map(category => category.id));
    for (const category of parsed.data.categories) {
      let categoryId = category.id;
      if (categoryId && existingIds.has(categoryId)) {
        await transaction.$executeRawUnsafe(
          `UPDATE service_desk_categories
              SET label = $1, is_active = $2, ai_enabled = $3, system_prompt = $4,
                  sort_order = $5, updated_at = now()
            WHERE id = $6::uuid AND company_id IS NOT DISTINCT FROM $7::uuid`,
          category.label,
          category.isActive,
          category.aiEnabled,
          category.systemPrompt,
          category.sortOrder,
          categoryId,
          context.companyId,
        );
      } else {
        const rows = await transaction.$queryRawUnsafe<Array<{ id: string }>>(
          `INSERT INTO service_desk_categories
            (id, company_id, key, label, is_active, ai_enabled, system_prompt, sort_order, updated_at)
           VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, $6, $7, now())
           RETURNING id`,
          context.companyId,
          category.key,
          category.label,
          category.isActive,
          category.aiEnabled,
          category.systemPrompt,
          category.sortOrder,
        );
        categoryId = rows[0].id;
      }
      if (!categoryId) throw new Error('Unable to save service desk category.');
      await transaction.$executeRawUnsafe(
        `DELETE FROM service_desk_category_assignees WHERE category_id = $1::uuid`,
        categoryId,
      );
      for (const userId of new Set(category.assigneeIds)) {
        await transaction.$executeRawUnsafe(
          `INSERT INTO service_desk_category_assignees (category_id, user_id) VALUES ($1::uuid, $2::uuid)`,
          categoryId,
          userId,
        );
      }
    }
  });

  await logAudit('AUDIT', 'Service desk categories updated.', 'API:Settings:ServiceDeskCategories', context.user.id, {
    companyId: context.companyId,
    categoryCount: parsed.data.categories.length,
    assignmentCount: parsed.data.categories.reduce((total, category) => total + category.assigneeIds.length, 0),
  });

  return NextResponse.json({ success: true });
}
