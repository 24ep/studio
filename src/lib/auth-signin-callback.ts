import { getResolvedAzureAdSettings } from '@/lib/auth-azure-ad-settings';
import { handleAzureAdSignIn } from '@/lib/auth-azure-ad-signin';
import { handleOutbornAccountSignIn } from '@/lib/auth-outborn-account-signin';
import type { SignInCallbackInput } from './auth-callback-types';

export async function handleSignInCallback(input: SignInCallbackInput) {
  if (input.account?.provider === 'outborn-account') {
    return handleOutbornAccountSignIn(input);
  }

  // Azure AD remains an explicit legacy compatibility path only. It is not the
  // canonical human identity authority after the Outborn Account cutover.
  const currentAzureAdSettings = await getResolvedAzureAdSettings();
  return handleAzureAdSignIn({
    user: input.user as unknown as Record<string, unknown>,
    account: input.account as unknown as Record<string, unknown> | null | undefined,
    profile: input.profile as unknown as Record<string, unknown> | null | undefined,
    isAzureAdConfigured: currentAzureAdSettings.isConfigured,
  });
}
