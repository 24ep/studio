"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function GlobalLoadingOverlay() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Show loading when pathname changes
    setIsLoading(true);
    
    // Hide loading after a short delay to allow page to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card border shadow-lg">
        <div className="animate-spin rounded-md h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm font-medium text-foreground">Loading...</p>
      </div>
    </div>
  );
} 