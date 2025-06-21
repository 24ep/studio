"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Stop loading when pathname changes (navigation completes)
    setIsLoading(false);
    setLoadingMessage('Loading...');
  }, [pathname]);

  const navigateWithLoading = (href: string, message?: string) => {
    setIsLoading(true);
    if (message) {
      setLoadingMessage(message);
    }
    router.push(href);
  };

  const startLoading = (message?: string) => {
    setIsLoading(true);
    if (message) {
      setLoadingMessage(message);
    }
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingMessage('Loading...');
  };

  return {
    isLoading,
    loadingMessage,
    navigateWithLoading,
    startLoading,
    stopLoading,
  };
} 