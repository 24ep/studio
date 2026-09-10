import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { readJsonObject } from '@/lib/response-json';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';
import {
  DEFAULT_SESSION_REQUEST_TIMEOUT_MS,
  isSessionValidationTimeout,
  resolveSessionValidationOptions,
  sessionResponseHasUser,
  shouldAttemptSessionValidation,
  shouldInitializeSessionValidation,
  shouldResetSessionValidationInterval,
  type SessionValidationOptions,
} from './session-validation-utils';

/**
 * Custom hook to validate user sessions and handle invalid sessions
 * @param options - Configuration options
 * @param options.validateInterval - How often to validate the session (in milliseconds, default: 30 minutes)
 * @param options.autoSignOut - Whether to automatically sign out on invalid session (default: true)
 * @param options.redirectTo - Where to redirect after sign out (default: '/auth/signin')
 */
export function useSessionValidation(options: SessionValidationOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const lastValidationTime = useRef<number>(0);
  const validationInProgress = useRef<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);
  const lastSessionIdRef = useRef<string | undefined>(undefined);
  const [isSessionValidationEnabled, setIsSessionValidationEnabled] = useState(false);

  const memoizedOptions = useMemo(
    () => resolveSessionValidationOptions(options),
    [options.validateInterval, options.autoSignOut, options.redirectTo],
  );

  const sessionId = useMemo(() => session?.user?.id, [session?.user?.id]);

  const validateSession = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const now = Date.now();
    const location = typeof window !== 'undefined' ? window.location : undefined;

    if (!shouldAttemptSessionValidation({
      location,
      now,
      lastValidationTime: lastValidationTime.current,
      status,
      validateInterval: memoizedOptions.validateInterval,
      validationInProgress: validationInProgress.current,
    })) {
      return;
    }

    validationInProgress.current = true;
    setIsValidating(true);
    lastValidationTime.current = now;

    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(DEFAULT_SESSION_REQUEST_TIMEOUT_MS),
      });

      if (response.status === 500) {
        if (status !== 'authenticated') {
          return;
        }
        console.warn('Session validation returned 500, but user is still authenticated. Skipping validation.');
        return;
      }

      if (!response.ok) {
        if (response.status !== 401 && response.status !== 403) {
          throw new Error('Session validation failed');
        }
        const sessionData = await readJsonObject(response);
        if (!sessionResponseHasUser(sessionData) && memoizedOptions.autoSignOut) {
          await signOut({ redirect: false });
          router.push(memoizedOptions.redirectTo);
        }
        return;
      }

      const sessionData = await readJsonObject(response);
      
      if (!sessionResponseHasUser(sessionData)) {
        if (memoizedOptions.autoSignOut) {
          await signOut({ redirect: false });
          router.push(memoizedOptions.redirectTo);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (isSessionValidationTimeout(error)) {
          console.warn('Session validation timeout, skipping');
          return;
        }

        if (status === 'authenticated') {
          console.error('Session validation error:', error);
        }
      }
    } finally {
      setIsValidating(false);
      validationInProgress.current = false;
    }
  }, [memoizedOptions, router, status]);

  const effectDependencies = useMemo(() => ({
    status,
    sessionId,
    validateInterval: memoizedOptions.validateInterval
  }), [status, sessionId, memoizedOptions.validateInterval]);

  useEffect(() => {
    const location = typeof window !== 'undefined' ? window.location : undefined;

    if (shouldResetSessionValidationInterval({ location, status: effectDependencies.status })) {
      setIsSessionValidationEnabled(false);
      hasInitializedRef.current = false;
      lastSessionIdRef.current = undefined;
      return;
    }

    if (!shouldInitializeSessionValidation({
      hasInitialized: hasInitializedRef.current,
      lastSessionId: lastSessionIdRef.current,
      sessionId: effectDependencies.sessionId,
    })) {
      return;
    }
    
    hasInitializedRef.current = true;
    lastSessionIdRef.current = effectDependencies.sessionId;

    validateSession();
    setIsSessionValidationEnabled(true);
  }, [effectDependencies, validateSession]);

  useVisibilityInterval(validateSession, effectDependencies.validateInterval, isSessionValidationEnabled);

  const memoizedValue = useMemo(() => ({
    isValidating,
    isAuthenticated: status === 'authenticated',
    session,
    validateSession
  }), [isValidating, status, session, validateSession]);

  return memoizedValue;
}
