const DOMAIN_PATTERN = /^(?=.{1,240}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function sanitizeEmployeeEmailDomainInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^@/, '')
    .split(/[/?#]/, 1)[0]
    .replace(/\.+$/, '');
}

export function normalizeEmployeeEmailDomain(value: string | null | undefined): string | null {
  if (!value) return null;
  const domain = sanitizeEmployeeEmailDomainInput(value);
  return DOMAIN_PATTERN.test(domain) ? domain : null;
}

function normalizeEmailNamePart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 48);
}

function employeeNumberDigits(employeeNumber: string): string {
  const digits = employeeNumber.replace(/\D/g, '');
  return digits.slice(-6).padStart(3, '0');
}

export function buildEmployeeEmailLocalPart(
  firstName: string,
  lastName: string,
  employeeNumber: string,
): string {
  const normalizedFirstName = normalizeEmailNamePart(firstName);
  const normalizedLastName = normalizeEmailNamePart(lastName);
  const fallback = employeeNumberDigits(employeeNumber);
  const firstPart = normalizedFirstName || 'employee';
  const lastPrefix = normalizedLastName.slice(0, 3) || fallback;

  return `${firstPart}.${lastPrefix}`.slice(0, 64);
}

export function buildEmployeeEmailCandidate(
  localPart: string,
  domain: string,
  sequence = 1,
): string {
  const suffix = sequence > 1 ? String(sequence) : '';
  const maxAddressLocalLength = 253 - domain.length;
  const maxBaseLength = Math.max(
    1,
    Math.min(64 - suffix.length, maxAddressLocalLength - suffix.length),
  );
  return `${localPart.slice(0, maxBaseLength)}${suffix}@${domain}`;
}
