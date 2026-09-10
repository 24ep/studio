import type { AiGenerationOptions, AiInlineFilePart, AiProvider } from './aiProvider-types';
import { generateDeepSeekText } from './aiProvider-deepseek';
import { generateGeminiText, generateGeminiTextWithFiles } from './aiProvider-gemini';
import { generateOpenAiText, generateOpenAiTextWithFiles } from './aiProvider-openai';

export async function generateTextWithProvider(
  provider: AiProvider,
  apiKey: string,
  model: string,
  prompt: string,
  options?: AiGenerationOptions
): Promise<string> {
  if (provider === 'openai') {
    return generateOpenAiText(apiKey, model, prompt, options);
  }

  if (provider === 'deepseek') {
    return generateDeepSeekText(apiKey, model, prompt, options);
  }

  return generateGeminiText(apiKey, model, prompt, options);
}

export async function generateTextWithProviderFiles(
  provider: AiProvider,
  apiKey: string,
  model: string,
  prompt: string,
  files: AiInlineFilePart[],
  options?: AiGenerationOptions
): Promise<string> {
  if (provider === 'openai') {
    return generateOpenAiTextWithFiles(apiKey, model, prompt, files, options);
  }

  if (provider === 'gemini') {
    return generateGeminiTextWithFiles(apiKey, model, prompt, files, options);
  }

  throw new Error('Image resume processing requires OpenAI or Gemini. DeepSeek supports text-only processing in this app.');
}
