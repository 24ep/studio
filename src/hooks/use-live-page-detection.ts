"use client";

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export function useLivePageDetection() {
  const pathname = usePathname();
  
  const isLivePage = useMemo(() => {
    // Pages with real-time updates
    const livePages = [
      '/', // Dashboard - has EventSource for dashboard streaming
      '/my-tasks', // My Task Board - uses useRealtimeCollaboration
      '/positions', // Positions - uses useRealtimeCollaboration
      '/applicants', // Applicants - has real-time collaboration
      '/process-queue', // Process queue - uses EventSource for upload queue
    ];
    
    // Check if current pathname matches any live page
    return livePages.some(page => {
      if (page === '/') {
        return pathname === '/';
      }
      return pathname.startsWith(page);
    });
  }, [pathname]);
  
  return { isLivePage };
}
