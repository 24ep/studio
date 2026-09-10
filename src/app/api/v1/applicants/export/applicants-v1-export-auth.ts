type ApplicantsV1ExportUser = {
  role?: string | null;
  modulePermissions?: string[] | null;
};

export function getBearerToken(authHeader: string | null) {
  return authHeader?.split(' ')[1] ?? null;
}

export function canExportApplicantsV1(user: ApplicantsV1ExportUser | null) {
  return Boolean(
    user &&
    (user.role === 'Admin' || user.modulePermissions?.includes('applicantS_EXPORT'))
  );
}
