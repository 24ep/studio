export const AUTHENTICATION_METHOD_OPTIONS = [
  {
    value: 'basic',
    label: 'Basic Authentication',
    description: 'Standard email and password login'
  },
  {
    value: 'azure_ad',
    label: 'Azure Active Directory',
    description: 'Microsoft SSO login (Requires configuration)'
  }
] as const;

export function updateAuthenticationMethods(
  currentMethods: string[] | undefined,
  method: string,
  checked: boolean
): string[] {
  const current = currentMethods ?? [];

  if (checked) {
    return current.includes(method) ? current : [...current, method];
  }

  return current.filter((currentMethod) => currentMethod !== method);
}
