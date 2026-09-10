const SUPPORTED_SCALAR_TYPES = new Set([
  'String',
  'Int',
  'Float',
  'Decimal',
  'BigInt',
  'Boolean',
  'DateTime',
]);

export function isSupportedCompanyPortalField(field: { isList: boolean; type: string }) {
  return !field.isList && SUPPORTED_SCALAR_TYPES.has(field.type);
}
