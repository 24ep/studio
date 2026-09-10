import { useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useThemeUserIdRef() {
  const { data: session } = useSession();
  const userIdRef = useRef<string | undefined>(undefined);
  const lastSessionIdRef = useRef<string | undefined>(undefined);

  const sessionId = useMemo(() => session?.user?.id, [session?.user?.id]);

  useEffect(() => {
    if (sessionId !== lastSessionIdRef.current) {
      lastSessionIdRef.current = sessionId;
      userIdRef.current = sessionId;
    }
  }, [sessionId]);

  return userIdRef;
}
