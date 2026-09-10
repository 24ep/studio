export interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  content: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemPromptCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemPromptFormData {
  name: string;
  description: string;
  content: string;
  categoryId: string;
  isActive: boolean;
}

export interface SystemPromptCategoryFormData {
  name: string;
  description: string;
  color: string;
  isActive: boolean;
}
