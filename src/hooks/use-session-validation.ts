import { useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook to validate user sessions and handle invalid sessions
 * @param options - Configuration options
 * @param options.validateInterval - How often to validate the session (in milliseconds, default: 5 minutes)
 * @param options.autoSignOut - Whether to automatically sign out on invalid session (default: true)
 * @param options.redirectTo - Where to redirect after sign out (default: '/auth/signin')
 */
export function useSessionValidation(options: {
  validateInterval?: number;
  autoSignOut?: boolean;
  redirectTo?: string;
} = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const {
    validateInterval = 5 * 60 * 1000, // 5 minutes
    autoSignOut = true,
    redirectTo = '/auth/signin'
  } = options;

  const validateSession = useCallback(async () => {
    if (status !== 'authenticated' || !session) {
      return;
    }

    try {
      const response = await fetch('/api/auth/validate-session', {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn('Session validation failed:', errorData.error);
        
        if (autoSignOut) {
          await signOut({ 
            callbackUrl: redirectTo,
            redirect: true 
          });
        }
      }
    } catch (error) {
      console.error('Session validation error:', error);
      // Don't auto sign out on network errors, only on validation failures
      // This prevents users from being logged out due to temporary network issues
    }
  }, [session, status, autoSignOut, redirectTo]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    // Validate immediately
    validateSession();

    // Set up periodic validation
    const interval = setInterval(validateSession, validateInterval);

    return () => {
      clearInterval(interval);
    };
  }, [validateSession, status, validateInterval]);

  return {
    isValidating: status === 'loading',
    isAuthenticated: status === 'authenticated',
    session,
    validateSession
  };
} 