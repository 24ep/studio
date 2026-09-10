import { describe, expect, it } from 'vitest';

import {
  buildCategoryFormData,
  buildPromptFormData,
  DEFAULT_CATEGORY_FORM_DATA,
  DEFAULT_PROMPT_FORM_DATA,
  filterSystemPromptCategories,
  filterSystemPrompts,
  getPromptSaveErrorMessage,
} from './system-prompts-page-utils';
import type { SystemPrompt, SystemPromptCategory } from './types';

const prompt: SystemPrompt = {
  id: 'prompt-1',
  name: 'Recruiter Summary',
  description: 'Creates summary',
  content: 'Summarize candidate',
  categoryId: 'cat-1',
  categoryName: 'Recruiting',
  categoryColor: '#123456',
  isActive: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
};

const category: SystemPromptCategory = {
  id: 'cat-1',
  name: 'Recruiting',
  description: '',
  color: '',
  isActive: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
};

describe('system-prompts-page-utils', () => {
  it('builds prompt and category form data', () => {
    expect(buildPromptFormData(prompt)).toEqual({
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      categoryId: prompt.categoryId,
      isActive: prompt.isActive,
    });

    expect(buildCategoryFormData(category)).toEqual({
      name: category.name,
      description: '',
      color: DEFAULT_CATEGORY_FORM_DATA.color,
      isActive: false,
    });

    expect(DEFAULT_PROMPT_FORM_DATA.isActive).toBe(true);
  });

  it('filters prompts by search term and category name', () => {
    const prompts = [
      prompt,
      {
        ...prompt,
        id: 'prompt-2',
        name: 'Offer Letter',
        description: 'Creates offer copy',
        categoryName: 'HR',
      },
    ];

    expect(
      filterSystemPrompts({
        prompts,
        searchTerm: 'summary',
        selectedCategory: 'all',
      }),
    ).toEqual([prompt]);

    expect(
      filterSystemPrompts({
        prompts,
        searchTerm: '',
        selectedCategory: 'HR',
      }),
    ).toHaveLength(1);
  });

  it('filters categories by name or description', () => {
    expect(
      filterSystemPromptCategories({
        categories: [
          category,
          { ...category, id: 'cat-2', name: 'Operations', description: 'SLA' },
        ],
        searchTerm: 'sla',
      }),
    ).toEqual([{ ...category, id: 'cat-2', name: 'Operations', description: 'SLA' }]);
  });

  it('maps known prompt save errors to user-facing messages', () => {
    expect(getPromptSaveErrorMessage('No categories found')).toContain(
      'create at least one',
    );
    expect(getPromptSaveErrorMessage('Invalid category')).toContain(
      'valid category',
    );
    expect(getPromptSaveErrorMessage(undefined)).toBe(
      'Failed to save system prompt',
    );
  });
});
