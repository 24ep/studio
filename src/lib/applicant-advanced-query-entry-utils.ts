const ADVANCED_QUERY_TOKEN_PATTERN = /(?:[^\s"]+:"[^"]*"|[^\s"]+)/g;

export type AdvancedQueryEntry = {
  key: string;
  value: string;
  raw: string;
};

export function getAdvancedQueryTokens(query: string): string[] {
  return safeDecodeURIComponent(query).match(ADVANCED_QUERY_TOKEN_PATTERN) || [];
}

export function getAdvancedQueryRawFieldParts(query: string): string[] {
  return getAdvancedQueryTokens(query).filter((part) => part.includes(':'));
}

export function parseAdvancedQueryEntries(query: string): AdvancedQueryEntry[] {
  return getAdvancedQueryTokens(query)
    .map(parseAdvancedQueryEntry)
    .filter((entry): entry is AdvancedQueryEntry => Boolean(entry));
}

function parseAdvancedQueryEntry(raw: string): AdvancedQueryEntry | null {
  const colonIndex = raw.indexOf(':');
  if (colonIndex === -1) return null;

  const key = raw.substring(0, colonIndex).trim();
  const value = stripWrappingQuotes(raw.substring(colonIndex + 1).trim());
  if (!key || !value) return null;

  return { key, value, raw };
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function stripWrappingQuotes(value: string) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}
