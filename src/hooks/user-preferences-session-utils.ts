export function isUserPreferencesReady(status: string, userId: string | undefined) {
  return status !== 'loading' && (status === 'authenticated' ? Boolean(userId) : true);
}
