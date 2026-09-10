"use client";

import { useEffect, useState, useRef } from 'react';

interface FaviconUpdaterProps {
  faviconDataUrl?: string | null;
}

export function FaviconUpdater({ faviconDataUrl }: FaviconUpdaterProps) {
  // faviconDataUrl is now a MinIO URL, not a data URL
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // If no custom favicon is provided, use the default
    if (!faviconDataUrl) {
      // Remove any existing custom favicon link
      const existingLink = document.querySelector('link[data-custom-favicon="true"]');
      if (existingLink) {
        existingLink.remove();
      }
      if (isMountedRef.current) {
        setCurrentFavicon(null);
      }
      return;
    }

    try {
      // Create or update the favicon link
      let faviconLink = document.querySelector('link[data-custom-favicon="true"]') as HTMLLinkElement;
      
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.setAttribute('data-custom-favicon', 'true');
        document.head.appendChild(faviconLink);
      }

      faviconLink.href = faviconDataUrl;
      if (isMountedRef.current) {
        setCurrentFavicon(faviconDataUrl);
      }
    } catch (error) {
      console.warn('[FAVICON_UPDATER] Error updating favicon:', error);
    }
  }, [faviconDataUrl]);

  // Listen for real-time favicon updates
  useEffect(() => {
    const handleFaviconUpdate = (event: CustomEvent) => {
      if (!isMountedRef.current) return;
      
      try {
        const { faviconDataUrl: newFaviconUrl } = event.detail;
        
        if (!newFaviconUrl) {
          // Remove custom favicon
          const existingLink = document.querySelector('link[data-custom-favicon="true"]');
          if (existingLink) {
            existingLink.remove();
          }
          setCurrentFavicon(null);
          return;
        }

        // Update favicon
        let faviconLink = document.querySelector('link[data-custom-favicon="true"]') as HTMLLinkElement;
        
        if (!faviconLink) {
          faviconLink = document.createElement('link');
          faviconLink.rel = 'icon';
          faviconLink.setAttribute('data-custom-favicon', 'true');
          document.head.appendChild(faviconLink);
        }

        faviconLink.href = newFaviconUrl;
        setCurrentFavicon(newFaviconUrl);
      } catch (error) {
        console.warn('[FAVICON_UPDATER] Error handling favicon update event:', error);
      }
    };

    window.addEventListener('faviconUpdated', handleFaviconUpdate as EventListener);
    
    return () => {
      isMountedRef.current = false;
      try {
        window.removeEventListener('faviconUpdated', handleFaviconUpdate as EventListener);
      } catch (error) {
        console.warn('[FAVICON_UPDATER] Error removing favicon update listener:', error);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
} 