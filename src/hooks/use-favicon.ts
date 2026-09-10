"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

export function useFavicon() {
  const [faviconDataUrl, setFaviconDataUrl] = useState<string | null>(null);
  const { settings } = useGlobalSettings();
  const lastUpdateTimeRef = useRef(0);
  const lastFaviconRef = useRef<string | null>(null);
  const isUpdatingRef = useRef(false);

  const updateFavicon = useCallback(() => {
    const now = Date.now();
    // Increased debouncing to 2 seconds to reduce frequent updates
    if (now - lastUpdateTimeRef.current < 2000) {
      return lastFaviconRef.current;
    }
    
    if (isUpdatingRef.current) return lastFaviconRef.current;
    isUpdatingRef.current = true;
    lastUpdateTimeRef.current = now;

    try {
      // Access the favicon URL directly from settings object
      const newFaviconDataUrl = settings?.appFaviconDataUrl || null;

      // Only update if the favicon has actually changed
      if (newFaviconDataUrl !== lastFaviconRef.current) {
        setFaviconDataUrl(newFaviconDataUrl);
        lastFaviconRef.current = newFaviconDataUrl;
      }
    } catch (error) {
      console.error('Error updating favicon:', error);
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 1000); // Increased from 500ms to 1000ms
    }

    return lastFaviconRef.current;
  }, [settings]);

  // Memoize the favicon data URL to prevent unnecessary re-renders
  const memoizedFaviconDataUrl = useMemo(() => {
    return updateFavicon();
  }, [updateFavicon]);

  // Memoize the return value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => ({
    faviconDataUrl: memoizedFaviconDataUrl,
  }), [memoizedFaviconDataUrl]);

  return memoizedValue;
} 
