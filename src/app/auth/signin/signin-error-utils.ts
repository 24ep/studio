const EXTERNAL_IDENTITY_ERROR_CODES = new Set([
  'OAuthSignin',
  'OAuthCallback',
  'OAuthCreateAccount',
  'EmailCreateAccount',
  'Callback',
  'OAuthAccountNotLinked',
  'EmailSignin',
  'SessionRequired',
  'OutbornAccount',
]);

export function getSignInErrorMessage(errorParam: string | null) {
  if (!errorParam) return '';

  if (
    errorParam === 'CredentialsSignin'
    || errorParam === 'Configuration'
  ) {
    return 'Sign-in could not be completed. Continue with Outborn Account or contact support.';
  }

  if (errorParam === 'SessionExpired') {
    return 'Your session has expired. Please sign in again.';
  }

  if (EXTERNAL_IDENTITY_ERROR_CODES.has(errorParam)) {
    return 'There was an error signing in with Outborn Account. Please try again or contact support.';
  }

  return decodeURIComponent(errorParam);
}
