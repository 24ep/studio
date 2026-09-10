"use client";

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useDynamicZIndex } from '@/contexts/ZIndexContext';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/contexts/LocalizationContext';

export function GlobalLoadingOverlay() {
  const { contentZIndex } = useDynamicZIndex('global-loading-overlay', 'overlay');
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only show loading for actual page changes, not for the same page
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }, 300); // Reduced from 500ms to 300ms for faster response

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm",
        "transition-opacity duration-300",
        isLoading ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      style={{ zIndex: contentZIndex }}
    >
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card border shadow-lg">
        <div className="animate-spin rounded-md h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm font-medium text-foreground">{t("status.loading", "Loading...")}</p>
      </div>
    </div>
  );
} 
