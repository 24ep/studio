import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LEARNING_COURSE_CATEGORIES,
  getLearningCourseCategoryChildren,
  getLearningCourseCategoryPath,
  parseLearningCourseCategories,
} from './learning-course-categories';

describe('learning course categories', () => {
  it('falls back to the starter hierarchy when no setting exists', () => {
    expect(parseLearningCourseCategories(undefined)).toEqual(DEFAULT_LEARNING_COURSE_CATEGORIES);
  });

  it('builds a readable path from the configured tree', () => {
    expect(getLearningCourseCategoryPath('compliance-safety', DEFAULT_LEARNING_COURSE_CATEGORIES)).toBe('Compliance / Health & safety');
  });

  it('only exposes active nodes to course selectors', () => {
    const categories = [...DEFAULT_LEARNING_COURSE_CATEGORIES, {
      id: 'inactive', name: 'Inactive', parentId: null, isActive: false, sortOrder: 40,
    }];
    expect(getLearningCourseCategoryChildren(null, categories).map(category => category.id)).not.toContain('inactive');
    expect(getLearningCourseCategoryChildren(null, categories, true).map(category => category.id)).toContain('inactive');
  });
});
