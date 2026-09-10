"use client";

import { useEffect, useState } from "react";

export function useDashboardAnimationFlags() {
  const [isPageRefresh, setIsPageRefresh] = useState(true);
  const [hasSSEUpdated, setHasSSEUpdated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageRefresh(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasSSEUpdated) {
      return;
    }

    const timer = setTimeout(() => {
      setHasSSEUpdated(false);
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasSSEUpdated]);

  return {
    hasSSEUpdated,
    isPageRefresh,
    setHasSSEUpdated,
  };
}
