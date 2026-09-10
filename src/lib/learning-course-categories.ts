export interface LearningCourseCategory {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export const DEFAULT_LEARNING_COURSE_CATEGORIES: LearningCourseCategory[] = [
  { id: 'compliance', name: 'Compliance', parentId: null, isActive: true, sortOrder: 10 },
  { id: 'compliance-safety', name: 'Health & safety', parentId: 'compliance', isActive: true, sortOrder: 10 },
  { id: 'compliance-policies', name: 'Policies & conduct', parentId: 'compliance', isActive: true, sortOrder: 20 },
  { id: 'professional-development', name: 'Professional development', parentId: null, isActive: true, sortOrder: 20 },
  { id: 'professional-development-leadership', name: 'Leadership', parentId: 'professional-development', isActive: true, sortOrder: 10 },
  { id: 'professional-development-functional', name: 'Functional skills', parentId: 'professional-development', isActive: true, sortOrder: 20 },
  { id: 'onboarding', name: 'Onboarding', parentId: null, isActive: true, sortOrder: 30 },
];

export function parseLearningCourseCategories(value: unknown): LearningCourseCategory[] {
  if (typeof value !== 'string') return DEFAULT_LEARNING_COURSE_CATEGORIES;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_LEARNING_COURSE_CATEGORIES;

    const categories = parsed.filter(isLearningCourseCategory).map(category => ({
      ...category,
      name: category.name.trim(),
    })).filter(category => category.name.length > 0);
    return categories.length > 0 ? categories : DEFAULT_LEARNING_COURSE_CATEGORIES;
  } catch {
    return DEFAULT_LEARNING_COURSE_CATEGORIES;
  }
}

function isLearningCourseCategory(value: unknown): value is LearningCourseCategory {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LearningCourseCategory>;
  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && (typeof candidate.parentId === 'string' || candidate.parentId === null)
    && typeof candidate.isActive === 'boolean'
    && typeof candidate.sortOrder === 'number';
}

export function getLearningCourseCategoryPath(
  categoryId: string,
  categories: LearningCourseCategory[],
): string {
  const byId = new Map(categories.map(category => [category.id, category]));
  const path: string[] = [];
  const seen = new Set<string>();
  let current = byId.get(categoryId);

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path.join(' / ');
}

export function getLearningCourseCategoryChildren(
  parentId: string | null,
  categories: LearningCourseCategory[],
  includeInactive = false,
) {
  return categories
    .filter(category => (includeInactive || category.isActive) && category.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}
