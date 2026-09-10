import prisma from '@/lib/prisma';
import {
  DEFAULT_SUPPORT_CATEGORIES,
  type ServiceDeskCategoryOption,
} from '@/lib/service-desk-contract';

export type ServiceDeskCategoryConfig = ServiceDeskCategoryOption & {
  id: string | null;
  isActive: boolean;
  aiEnabled: boolean;
  systemPrompt: string;
  sortOrder: number;
  assigneeIds: string[];
};

type CategoryRow = {
  id: string;
  key: string;
  label: string;
  isActive: boolean;
  aiEnabled: boolean;
  systemPrompt: string;
  sortOrder: number;
  assigneeIds: string[] | null;
};

export function defaultServiceDeskCategories(): ServiceDeskCategoryConfig[] {
  return DEFAULT_SUPPORT_CATEGORIES.map((category, index) => ({
    ...category,
    id: null,
    isActive: true,
    aiEnabled: false,
    systemPrompt: '',
    sortOrder: (index + 1) * 10,
    assigneeIds: [],
  }));
}

export async function getServiceDeskCategories(companyId: string | null, includeInactive = false) {
  const rows = await prisma.$queryRawUnsafe<CategoryRow[]>(
    `SELECT category.id, category.key, category.label,
            category.is_active AS "isActive", category.ai_enabled AS "aiEnabled",
            category.system_prompt AS "systemPrompt", category.sort_order AS "sortOrder",
            COALESCE(array_agg(assignment.user_id::text ORDER BY assignment.user_id)
              FILTER (WHERE assignment.user_id IS NOT NULL), ARRAY[]::text[]) AS "assigneeIds"
      FROM service_desk_categories category
       LEFT JOIN service_desk_category_assignees assignment ON assignment.category_id = category.id
      WHERE category.company_id IS NOT DISTINCT FROM $1::uuid
      GROUP BY category.id
      ORDER BY category.sort_order, lower(category.label), category.id`,
    companyId,
  );

  if (rows.length > 0) return rows.filter(category => includeInactive || category.isActive);
  return defaultServiceDeskCategories().filter(category => includeInactive || category.isActive);
}

export async function isActiveServiceDeskCategory(companyId: string | null, key: string) {
  const categories = await getServiceDeskCategories(companyId);
  return categories.some(category => category.key === key && category.isActive);
}
