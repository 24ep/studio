export function isNextRedirectError(error: unknown) {
  return typeof (error as { digest?: unknown })?.digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT');
}
