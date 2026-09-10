const PUBLIC_LOGO_FILE_PATH_PREFIXES = ['settings/', 'applicant-source-logo/'];

export function isPublicLogoFilePath(filePath: string) {
  const lowerFilePath = filePath.toLowerCase();
  return PUBLIC_LOGO_FILE_PATH_PREFIXES.some(prefix => lowerFilePath.startsWith(prefix));
}
