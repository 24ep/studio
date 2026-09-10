import type { AppKitLocalizationConfig } from './appkit-sdk-client';

export function localeBase(locale: string | null | undefined) {
  return String(locale || '').trim().toLowerCase().replace('_', '-').split('-')[0];
}

export function localeMatches(left: string | null | undefined, right: string | null | undefined) {
  if (!left || !right) return false;
  return left.toLowerCase() === right.toLowerCase() || localeBase(left) === localeBase(right);
}

export function resolveSupportedLocale(
  preferred: string | null | undefined,
  supported: string[],
  fallback = 'en',
) {
  if (!supported.length) return preferred || fallback;
  const candidates = [preferred, fallback, supported[0]].filter(Boolean) as string[];
  return candidates.flatMap(candidate => {
    const exact = supported.find(item => item.toLowerCase() === candidate.toLowerCase());
    const base = supported.find(item => localeBase(item) === localeBase(candidate));
    return [exact, base];
  }).find(Boolean) || supported[0];
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

/**
 * Older screens used three spellings for shared copy. Treat them as aliases so
 * AppKit only needs one common label per intent while migrated screens keep
 * working with existing catalogs.
 */
export function localizationKeyCandidates(key: string) {
  const normalized = key.trim();
  const commonMatch = normalized.match(/^(?:app[.-])?common[.-](.+)$/i);
  if (!commonMatch) return [normalized];

  const suffix = commonMatch[1];
  return Array.from(new Set([
    `common.${suffix}`,
    `app.common.${suffix}`,
    `app-common.${suffix}`,
    normalized,
  ]));
}

type TemplateEntry = {
  anchorCandidates: string[];
  key: string;
  literalLength: number;
  pattern: RegExp;
  tokens: string[];
};

type LocalizationIndex = {
  dynamicResults: Map<string, string>;
  keysByNormalizedKey: Map<string, string>;
  keysByNormalizedValue: Map<string, string>;
  templatesByAnchor: Map<string, TemplateEntry[]>;
  templatesWithoutAnchors: TemplateEntry[];
  templates: TemplateEntry[];
};

const localizationIndexCache = new WeakMap<AppKitLocalizationConfig, LocalizationIndex>();
const PLACEHOLDER_PATTERN = /\{\{?[\w.-]+\}?\}|%\d*\$?[sd]/g;
const TEMPLATE_ANCHOR_PATTERN = /[\p{L}\p{N}]+/gu;
const MAX_DYNAMIC_RESULT_CACHE_SIZE = 2000;

function getTemplateAnchorCandidates(value: string) {
  return Array.from(new Set(
    (value.match(TEMPLATE_ANCHOR_PATTERN) || []).map(token => token.toLocaleLowerCase()),
  ));
}

function escapePatternLiteral(value: string) {
  return value
    .split(/\s+/)
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s+');
}

function compileTemplate(key: string, value: string): TemplateEntry | null {
  const tokens = [...value.matchAll(PLACEHOLDER_PATTERN)];
  if (!tokens.length) return null;

  let cursor = 0;
  let pattern = '^';
  let literalLength = 0;
  const literals: string[] = [];
  for (const token of tokens) {
    const literal = value.slice(cursor, token.index);
    literals.push(literal);
    literalLength += literal.trim().length;
    pattern += escapePatternLiteral(literal);
    pattern += '(.+?)';
    cursor = (token.index || 0) + token[0].length;
  }
  const tail = value.slice(cursor);
  literals.push(tail);
  literalLength += tail.trim().length;
  pattern += `${escapePatternLiteral(tail)}$`;
  if (!literalLength) return null;

  return {
    anchorCandidates: getTemplateAnchorCandidates(literals.join(' ')),
    key,
    literalLength,
    pattern: new RegExp(pattern, 'iu'),
    tokens: tokens.map(token => token[0]),
  };
}

function buildTemplateAnchorIndex(templates: TemplateEntry[]) {
  const anchorFrequency = new Map<string, number>();
  for (const template of templates) {
    for (const anchor of template.anchorCandidates) {
      anchorFrequency.set(anchor, (anchorFrequency.get(anchor) || 0) + 1);
    }
  }

  const templatesByAnchor = new Map<string, TemplateEntry[]>();
  const templatesWithoutAnchors: TemplateEntry[] = [];
  for (const template of templates) {
    const anchor = template.anchorCandidates.reduce<string | null>((best, candidate) => {
      if (!best) return candidate;
      const candidateFrequency = anchorFrequency.get(candidate) || Number.MAX_SAFE_INTEGER;
      const bestFrequency = anchorFrequency.get(best) || Number.MAX_SAFE_INTEGER;
      if (candidateFrequency !== bestFrequency) return candidateFrequency < bestFrequency ? candidate : best;
      return candidate.length > best.length ? candidate : best;
    }, null);

    if (!anchor) {
      templatesWithoutAnchors.push(template);
      continue;
    }
    const bucket = templatesByAnchor.get(anchor) || [];
    bucket.push(template);
    templatesByAnchor.set(anchor, bucket);
  }

  return { templatesByAnchor, templatesWithoutAnchors };
}

function getLocalizationIndex(config: AppKitLocalizationConfig) {
  const cached = localizationIndexCache.get(config);
  if (cached) return cached;

  const keysByNormalizedKey = new Map<string, string>();
  const keysByNormalizedValue = new Map<string, string>();
  const templatesBySignature = new Map<string, TemplateEntry>();
  const languagePriority = [
    config.defaultLanguage,
    config.fallbackLanguage,
    'en',
    ...Object.keys(config.translations || {}),
  ].filter((language, index, all): language is string =>
    Boolean(language) && all.findIndex(item => localeMatches(item, language)) === index,
  );

  for (const language of languagePriority) {
    const matchingLanguage = Object.keys(config.translations || {}).find(item => localeMatches(item, language));
    const values = config.translations?.[matchingLanguage || language] || {};
    for (const [key, value] of Object.entries(values)) {
      if (!value?.trim()) continue;
      const normalizedKey = normalizeText(key);
      const normalizedValue = normalizeText(value);
      if (!keysByNormalizedKey.has(normalizedKey)) keysByNormalizedKey.set(normalizedKey, key);
      if (!keysByNormalizedValue.has(normalizedValue)) keysByNormalizedValue.set(normalizedValue, key);
      const template = compileTemplate(key, value.trim());
      if (template) templatesBySignature.set(`${key}\u0000${normalizeText(value)}`, template);
    }
  }

  const templates = [...templatesBySignature.values()]
    .sort((left, right) => right.literalLength - left.literalLength);
  const { templatesByAnchor, templatesWithoutAnchors } = buildTemplateAnchorIndex(templates);
  const index = {
    dynamicResults: new Map<string, string>(),
    keysByNormalizedKey,
    keysByNormalizedValue,
    templates,
    templatesByAnchor,
    templatesWithoutAnchors,
  };
  localizationIndexCache.set(config, index);
  return index;
}

function getCandidateTemplates(index: LocalizationIndex, value: string) {
  const candidates = new Set<TemplateEntry>(index.templatesWithoutAnchors);
  for (const anchor of getTemplateAnchorCandidates(value)) {
    for (const template of index.templatesByAnchor.get(anchor) || []) {
      candidates.add(template);
    }
  }
  return Array.from(candidates).sort((left, right) => right.literalLength - left.literalLength);
}

function cacheDynamicResult(index: LocalizationIndex, cacheKey: string, value: string) {
  if (index.dynamicResults.size >= MAX_DYNAMIC_RESULT_CACHE_SIZE) {
    const oldestKey = index.dynamicResults.keys().next().value;
    if (oldestKey) index.dynamicResults.delete(oldestKey);
  }
  index.dynamicResults.set(cacheKey, value);
}

function languageCandidates(config: AppKitLocalizationConfig, locale: string) {
  const fallback = config.fallbackLanguage || config.defaultLanguage || 'en';
  const available = Object.keys(config.translations || {});
  return [locale, fallback, ...available].filter((candidate, index, all) =>
    candidate && all.findIndex(item => localeMatches(item, candidate)) === index,
  );
}

function translationForKey(config: AppKitLocalizationConfig, languages: string[], key: string) {
  for (const language of languages) {
    const matchingLanguage = Object.keys(config.translations || {}).find(item => localeMatches(item, language));
    const translated = config.translations?.[matchingLanguage || language]?.[key];
    if (translated) return translated;
  }
  return null;
}

function interpolateTemplate(template: string, tokens: string[], captures: string[]) {
  const capturedByToken = new Map<string, string>();
  tokens.forEach((token, index) => capturedByToken.set(token, captures[index]));
  let sequentialIndex = 0;
  return template.replace(PLACEHOLDER_PATTERN, token => {
    const captured = capturedByToken.get(token) ?? captures[sequentialIndex];
    sequentialIndex += 1;
    return captured ?? token;
  });
}

function translateDynamicTemplate(
  config: AppKitLocalizationConfig,
  languages: string[],
  locale: string,
  value: string,
) {
  const index = getLocalizationIndex(config);
  const cacheKey = `${locale}\u0000${value}`;
  if (index.dynamicResults.has(cacheKey)) return index.dynamicResults.get(cacheKey) || null;

  for (const template of getCandidateTemplates(index, value)) {
    const match = value.match(template.pattern);
    if (!match) continue;
    const translatedTemplate = translationForKey(config, languages, template.key);
    if (!translatedTemplate) continue;
    const translated = interpolateTemplate(translatedTemplate, template.tokens, match.slice(1));
    cacheDynamicResult(index, cacheKey, translated);
    return translated;
  }

  cacheDynamicResult(index, cacheKey, '');
  return null;
}

/**
 * Resolve both semantic keys (for example `nav.dashboard`) and source-copy
 * fallbacks. The latter keeps older screens localizable while they migrate to
 * explicit keys and lets AppKit catalogs use either representation.
 */
export function translateWithConfig(
  config: AppKitLocalizationConfig | null,
  locale: string,
  key: string,
  fallback?: string,
) {
  if (!config?.translations) return fallback || key;
  const languages = languageCandidates(config, locale);
  const directCandidates = [
    ...localizationKeyCandidates(key),
    fallback,
  ].filter(Boolean) as string[];
  const index = getLocalizationIndex(config);

  for (const language of languages) {
    const matchingLanguage = Object.keys(config.translations).find(item => localeMatches(item, language));
    const values = config.translations[matchingLanguage || language] || {};
    for (const candidate of directCandidates) {
      const direct = values[candidate];
      if (direct) return direct;
      const normalizedKey = index.keysByNormalizedKey.get(normalizeText(candidate));
      if (normalizedKey && values[normalizedKey]) return values[normalizedKey];
    }
  }

  if (fallback) {
    const sourceKey = index.keysByNormalizedValue.get(normalizeText(fallback));
    if (sourceKey) {
      const translated = translationForKey(config, languages, sourceKey);
      if (translated) return translated;
    }

    const dynamic = translateDynamicTemplate(config, languages, locale, fallback);
    if (dynamic) return dynamic;
  }

  return fallback || key;
}

export function preserveTextWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] || '';
  const trailing = source.match(/\s*$/)?.[0] || '';
  return `${leading}${translated.trim()}${trailing}`;
}

export function getLocalizationKeywordUniverse(config: AppKitLocalizationConfig) {
  const keywords = new Set<string>();
  for (const values of Object.values(config.translations || {})) {
    if (!values) continue;
    for (const key of Object.keys(values)) {
      const normalized = key.trim();
      if (normalized) keywords.add(normalized);
    }
  }

  const activePackage = config.packages?.find(item => item.id === config.activePackageId)
    || config.packages?.[0];

  for (const keyword of activePackage?.keywords || []) {
    const normalized = keyword.key?.trim();
    if (normalized) keywords.add(normalized);
  }

  return Array.from(keywords).sort((left, right) => left.localeCompare(right));
}

export function hasLocalizedValue(config: AppKitLocalizationConfig, locale: string, key: string) {
  for (const [translationLocale, values] of Object.entries(config.translations || {})) {
    if (!localeMatches(translationLocale, locale)) continue;
    if (typeof values?.[key] === 'string' && values[key].trim()) return true;
  }
  return false;
}

export function getMissingLocalizationKeys(config: AppKitLocalizationConfig, locale: string) {
  const universe = getLocalizationKeywordUniverse(config);
  const missing = universe.filter(key => !hasLocalizedValue(config, locale, key));
  return { count: universe.length, translated: universe.length - missing.length, missing };
}
