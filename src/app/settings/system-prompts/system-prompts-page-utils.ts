import type {
  SystemPrompt,
  SystemPromptCategory,
  SystemPromptCategoryFormData,
  SystemPromptFormData,
} from './types';
import { getJsonErrorMessage, readJsonObject } from '../../../lib/response-json';

export const DEFAULT_PROMPT_FORM_DATA: SystemPromptFormData = {
  name: '',
  description: '',
  content: '',
  categoryId: '',
  isActive: true,
};

export const DEFAULT_CATEGORY_FORM_DATA: SystemPromptCategoryFormData = {
  name: '',
  description: '',
  color: '#3B82F6',
  isActive: true,
};

export function buildPromptFormData(prompt: SystemPrompt): SystemPromptFormData {
  return {
    name: prompt.name,
    description: prompt.description,
    content: prompt.content,
    categoryId: prompt.categoryId,
    isActive: prompt.isActive,
  };
}

export function buildCategoryFormData(
  category: SystemPromptCategory,
): SystemPromptCategoryFormData {
  return {
    name: category.name,
    description: category.description || '',
    color: category.color || DEFAULT_CATEGORY_FORM_DATA.color,
    isActive: category.isActive,
  };
}

export function filterSystemPrompts({
  prompts,
  searchTerm,
  selectedCategory,
}: {
  prompts: SystemPrompt[];
  searchTerm: string;
  selectedCategory: string;
}) {
  const query = searchTerm.toLowerCase();

  return prompts.filter((prompt) => {
    const matchesSearch =
      prompt.name.toLowerCase().includes(query) ||
      prompt.description.toLowerCase().includes(query);
    const matchesCategory =
      selectedCategory === 'all' || prompt.categoryName === selectedCategory;

    return matchesSearch && matchesCategory;
  });
}

export function filterSystemPromptCategories({
  categories,
  searchTerm,
}: {
  categories: SystemPromptCategory[];
  searchTerm: string;
}) {
  const query = searchTerm.toLowerCase();

  return categories.filter(
    (category) =>
      category.name.toLowerCase().includes(query) ||
      Boolean(
        category.description &&
          category.description.toLowerCase().includes(query),
      ),
  );
}

export async function readSystemPromptErrorMessage(
  response: Response,
  fallback: string,
) {
  return getJsonErrorMessage(await readJsonObject(response), fallback);
}

export function getPromptSaveErrorMessage(message: string | undefined) {
  if (message?.includes('No categories')) {
    return 'Please create at least one system prompt category first before creating prompts.';
  }

  if (message?.includes('Invalid category')) {
    return 'Please select a valid category.';
  }

  return message || 'Failed to save system prompt';
}

export function shouldShowMissingCategoriesToast(message: string | undefined) {
  return Boolean(message?.includes('No categories'));
}
