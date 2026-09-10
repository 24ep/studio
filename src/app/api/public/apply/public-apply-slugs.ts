export type PublicApplySlugPosition = {
  id: string;
  title: string;
  customAttributes?: unknown;
};

function parseCustomAttributes(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

export function slugifyPublicApplyValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function getPositionPublicApplySlug(position: PublicApplySlugPosition) {
  const attributes = parseCustomAttributes(position.customAttributes);
  const customSlug = typeof attributes.publicApplySlug === 'string'
    ? slugifyPublicApplyValue(attributes.publicApplySlug)
    : '';

  return customSlug || `${slugifyPublicApplyValue(position.title) || 'position'}-${position.id.slice(0, 8)}`;
}

export function getPositionPublicApplyPath(position: PublicApplySlugPosition) {
  return `/apply/${getPositionPublicApplySlug(position)}`;
}

export function findPositionByPublicApplySlug<T extends PublicApplySlugPosition>(positions: T[], slug: string | null) {
  if (!slug) return null;
  const normalizedSlug = slugifyPublicApplyValue(slug);
  return positions.find((position) => (
    position.id === slug
    || getPositionPublicApplySlug(position) === normalizedSlug
  )) || null;
}
