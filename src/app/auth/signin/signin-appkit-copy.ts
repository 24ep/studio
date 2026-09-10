import type { SystemSetting } from '@/lib/types';

export type SignInHeroCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

const DEFAULT_COPY: SignInHeroCopy = {
  eyebrow: 'Hiring intelligence, simplified',
  title: 'Build stronger teams with every hire.',
  description: 'Bring candidates, interviews, and hiring decisions together in one clear, secure workspace.',
};

export function getSignInHeroCopy(settings?: SystemSetting[]): SignInHeroCopy {
  const compactCopy = {
    eyebrow: settings?.find(setting => String(setting.key) === 'loginHeroEyebrow')?.value?.trim(),
    title: settings?.find(setting => String(setting.key) === 'loginHeroTitle')?.value?.trim(),
    description: settings?.find(setting => String(setting.key) === 'loginHeroDescription')?.value?.trim(),
  };
  if (compactCopy.eyebrow || compactCopy.title || compactCopy.description) {
    return {
      eyebrow: compactCopy.eyebrow || DEFAULT_COPY.eyebrow,
      title: compactCopy.title || DEFAULT_COPY.title,
      description: compactCopy.description || DEFAULT_COPY.description,
    };
  }

  const rawConfig = settings?.find(setting => String(setting.key) === 'appkitLocalizationConfig')?.value;
  if (!rawConfig) return DEFAULT_COPY;

  try {
    const snapshot = JSON.parse(rawConfig) as {
      config?: {
        defaultLanguage?: string;
        fallbackLanguage?: string;
        translations?: Record<string, Record<string, string>>;
      };
    };
    const config = snapshot.config;
    const language = config?.defaultLanguage || config?.fallbackLanguage || 'en';
    const translations = config?.translations?.[language] || config?.translations?.en || {};

    return {
      eyebrow: translations['auth.login.hero.eyebrow']?.trim() || DEFAULT_COPY.eyebrow,
      title: translations['auth.login.hero.title']?.trim() || DEFAULT_COPY.title,
      description: translations['auth.login.hero.description']?.trim() || DEFAULT_COPY.description,
    };
  } catch {
    return DEFAULT_COPY;
  }
}
