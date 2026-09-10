"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';

function clearTimeoutRef(timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  if (!timeoutRef.current) return;

  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

export function useTaskBoardScroll() {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollTimeRef = useRef(0);

  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  const scrollLeft = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTimeRef.current < 50) return;

      lastScrollTimeRef.current = now;
      clearTimeoutRef(scrollThrottleRef);
      scrollThrottleRef.current = setTimeout(updateScrollButtons, 50);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    const initialCheckTimeout = setTimeout(updateScrollButtons, 200);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(initialCheckTimeout);
      clearTimeoutRef(scrollThrottleRef);
    };
  }, [updateScrollButtons]);

  useEffect(() => {
    const handleResize = () => {
      clearTimeoutRef(resizeTimeoutRef);
      resizeTimeoutRef.current = setTimeout(updateScrollButtons, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeoutRef(resizeTimeoutRef);
    };
  }, [updateScrollButtons]);

  useEffect(() => {
    return () => {
      clearTimeoutRef(resizeTimeoutRef);
      clearTimeoutRef(scrollThrottleRef);
    };
  }, []);

  return {
    canScrollLeft,
    canScrollRight,
    scrollContainerRef,
    scrollLeft,
    scrollRight,
  };
}
