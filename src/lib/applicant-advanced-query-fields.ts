export const VALID_ADVANCED_QUERY_FIELDS = [
  'name', 'email', 'phone', 'skills', 'location', 'status', 'position', 'positionid',
  'recruiter', 'recruiterid', 'selectedsourceids', 'education', 'minfitscore', 'maxfitscore',
  'minappliedjobfitscore', 'maxappliedjobfitscore', 'matchingfitscore',
  'matchingfitscoremin', 'matchingfitscoremax', 'minmatchingjobfitscore', 'maxmatchingjobfitscore',
  'minexperienceyears', 'maxexperienceyears', 'applicationdatestart', 'applicationdateend', 'locationoperator',
];

export const NUMERIC_ADVANCED_QUERY_FIELDS = new Set([
  'minfitscore',
  'maxfitscore',
  'minappliedjobfitscore',
  'maxappliedjobfitscore',
  'minmatchingjobfitscore',
  'maxmatchingjobfitscore',
  'matchingfitscore',
  'matchingfitscoremin',
  'matchingfitscoremax',
  'minexperienceyears',
  'maxexperienceyears',
]);

export const DATE_ADVANCED_QUERY_FIELDS = new Set([
  'applicationdatestart',
  'applicationdateend',
]);

export function isValidAdvancedQueryField(field: string): boolean {
  return VALID_ADVANCED_QUERY_FIELDS.includes(field);
}

export function getUnknownAdvancedQueryFieldSuggestions(field: string): string[] {
  const suggestions = VALID_ADVANCED_QUERY_FIELDS.filter((validField) => (
    validField.toLowerCase().includes(field) ||
    field.includes(validField.toLowerCase())
  ));

  return suggestions.length > 0
    ? [`Did you mean: ${suggestions.join(', ')}?`]
    : [`Valid fields: ${VALID_ADVANCED_QUERY_FIELDS.slice(0, 5).join(', ')}...`];
}
