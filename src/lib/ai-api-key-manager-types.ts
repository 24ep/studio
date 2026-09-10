import type { AiProvider } from '@/lib/aiProvider';

export interface ApiKeyConfig {
  key: string;
  priority: number;
  isActive: boolean;
  lastUsed?: Date;
  lastError?: string;
  errorCount: number;
  selectedModel?: string;
  provider: AiProvider;
}

export interface ApiKeyResult {
  success: boolean;
  apiKey?: string;
  error?: string;
  keyIndex?: number;
  attempts: number;
  provider: AiProvider;
}

export interface ApiKeyInput {
  key: string;
  priority: number;
  selectedModel?: string;
}
