"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Button } from '@/components/ui/button';
import { SplashScreen } from '@/components/ui/SplashScreen';
import type { SystemSetting } from '@/lib/types';
import { safeRedirect } from '@/lib/safe-redirect';
import { getSignInErrorMessage } from './signin-error-utils';
import { getSafeSignInRedirectUrl } from './signin-page-utils';
import { useSignInPageProtection } from './use-signin-page-protection';

interface SignInClientProps {
  initialSettings?: SystemSetting[];
}

export default function SignInClient({ initialSettings }: SignInClientProps) {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const authenticatedRedirectRef = useRef(false);
  const accountSignInAttemptedRef = useRef(false);
  const [isStartingAccountSignIn, setIsStartingAccountSignIn] = useState(false);
  const [accountSignInError, setAccountSignInError] = useState('');

  useSignInPageProtection(initialSettings);

  const callbackUrl = getSafeSignInRedirectUrl(searchParams.get('callbackUrl') || '/');
  const errorCode = searchParams.get('error');
  const isSignoutRedirect = searchParams.get('signout') === 'true';

  const startAccountSignIn = useCallback(async () => {
    if (accountSignInAttemptedRef.current) return;

    accountSignInAttemptedRef.current = true;
    setAccountSignInError('');
    setIsStartingAccountSignIn(true);

    try {
      const result = await signIn('outborn-account', {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        accountSignInAttemptedRef.current = false;
        setIsStartingAccountSignIn(false);
        setAccountSignInError(getSignInErrorMessage(result.error));
        return;
      }

      if (result?.url) {
        window.location.assign(result.url);
        return;
      }

      accountSignInAttemptedRef.current = false;
      setIsStartingAccountSignIn(false);
      setAccountSignInError('Outborn Account did not return a sign-in destination. Please try again.');
    } catch (error) {
      console.error('[OBSI PEOPLE SIGNIN] Failed to start Outborn Account sign-in:', error);
      accountSignInAttemptedRef.current = false;
      setIsStartingAccountSignIn(false);
      setAccountSignInError('Unable to connect to Outborn Account. Please try again.');
    }
  }, [callbackUrl]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id || authenticatedRedirectRef.current) return;

    authenticatedRedirectRef.current = true;
    safeRedirect(callbackUrl, '/');
  }, [callbackUrl, session, status]);

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    if (errorCode || isSignoutRedirect || accountSignInError) return;

    void startAccountSignIn();
  }, [accountSignInError, errorCode, isSignoutRedirect, startAccountSignIn, status]);

  const retryAccountSignIn = () => {
    accountSignInAttemptedRef.current = false;
    void startAccountSignIn();
  };

  const errorMessage = accountSignInError || getSignInErrorMessage(errorCode);
  const showFallback = status === 'unauthenticated' && (Boolean(errorMessage) || isSignoutRedirect);

  if (!showFallback) {
    return (
      <SplashScreen
        persistent
        completedSteps={status === 'loading' ? 1 : 2}
        totalSteps={2}
      />
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-5 py-10 dark:bg-zinc-950">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-baseline justify-center gap-1.5 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white" aria-label="Obsi People">
          <span>Obsi</span>
          <span className="text-slate-500 dark:text-zinc-400">People</span>
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
          {isSignoutRedirect ? 'You’re signed out' : 'Sign-in needs another try'}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-zinc-400">
          {isSignoutRedirect
            ? 'Continue with your Outborn Account when you’re ready to return to Obsi People.'
            : errorMessage || 'Continue with Outborn Account to access Obsi People.'}
        </p>

        <Button
          type="button"
          onClick={retryAccountSignIn}
          disabled={isStartingAccountSignIn}
          className="mt-7 h-11 w-full rounded-xl text-sm font-semibold"
        >
          {isStartingAccountSignIn ? 'Connecting…' : 'Continue with Outborn Account'}
        </Button>
      </section>
    </main>
  );
}
