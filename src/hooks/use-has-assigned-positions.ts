"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useHasAssignedPositions() {
  const { data: session } = useSession();
  const [hasPositions, setHasPositions] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkHasAssignedPositions = useCallback(async () => {
    if (!session?.user?.id) {
      setHasPositions(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/positions/recruiter-assigned?recruiterId=${session.user.id}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setHasPositions((data.data || []).length > 0);
      } else {
        setHasPositions(false);
      }
    } catch (error) {
      console.error('Error checking assigned positions:', error);
      setHasPositions(false);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    checkHasAssignedPositions();
  }, [checkHasAssignedPositions]);

  return { hasPositions, isLoading, refetch: checkHasAssignedPositions };
}
