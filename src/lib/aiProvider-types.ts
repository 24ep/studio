export type AiProvider = 'gemini' | 'openai' | 'deepseek';

export interface AiModelInfo {
  name: string;
  displayName: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

export interface AiGenerationOptions {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface AiInlineFilePart {
  mimeType: string;
  dataBase64: string;
}
