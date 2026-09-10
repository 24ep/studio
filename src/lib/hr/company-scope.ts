export type CompanyScope = {
  allowed: boolean;
  companyId: string | null;
};

/**
 * Non-admin actors always inherit their employee company. Global administrators
 * have a null actor company and may optionally select a company.
 */
export function resolveCompanyScope(
  actorCompanyId: string | null,
  requestedCompanyId: string | null | undefined,
): CompanyScope {
  if (!actorCompanyId) {
    return { allowed: true, companyId: requestedCompanyId ?? null };
  }
  if (requestedCompanyId && requestedCompanyId !== actorCompanyId) {
    return { allowed: false, companyId: actorCompanyId };
  }
  return { allowed: true, companyId: actorCompanyId };
}
