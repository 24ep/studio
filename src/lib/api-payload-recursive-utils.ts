export type RecursiveNormalizer = (value: unknown) => unknown;

export function isObjectPayload(value: unknown) {
  return value !== null && typeof value === 'object';
}

export function mapNestedPayload(value: unknown, normalize: RecursiveNormalizer): unknown {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (isObjectPayload(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalize(nestedValue)])
    );
  }

  return undefined;
}
