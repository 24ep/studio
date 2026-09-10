export interface CreateApiKeyInput {
  name: string;
  description?: string;
  expiresAt?: Date | null;
  createdById?: string;
}

export interface ApiKeyData {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  isActive: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  usageCount: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyResult {
  success: boolean;
  apiKey?: string;
  data?: ApiKeyData;
  error?: string;
}

export interface ValidateApiKeyResult {
  valid: boolean;
  data?: ApiKeyData;
  error?: string;
}

export type ApiKeyUpdateInput = Partial<Pick<ApiKeyData, 'name' | 'description' | 'isActive' | 'expiresAt'>>;

