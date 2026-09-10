"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { Loader2 } from 'lucide-react';

let hasShownSplashForCurrentDocument = false;
let nextSplashInstanceId = 1;
const splashInstances = new Map<number, { isVisible: boolean; persistent: boolean }>();
const splashSubscribers = new Set<() => void>();
const DEFAULT_SPLASH_LOGO_URL = '/icon.png';

function getActiveSplashInstanceId() {
  const visibleInstances = Array.from(splashInstances.entries())
    .filter(([, instance]) => instance.isVisible);
  const persistentInstances = visibleInstances
    .filter(([, instance]) => instance.persistent);
  const candidates = persistentInstances.length > 0 ? persistentInstances : visibleInstances;
  const activeCandidate = candidates.at(-1);

  return activeCandidate?.[0] ?? null;
}

function notifySplashSubscribers() {
  splashSubscribers.forEach(listener => listener());
}

function getStoredSplashLogoUrl() {
  if (typeof window === 'undefined') return null;

  return (
    window.localStorage.getItem('splashLogoDataUrl') ||
    window.localStorage.getItem('appLogoDataUrl')
  );
}

interface SplashScreenProps {
  persistent?: boolean;
  completedSteps?: number;
  totalSteps?: number;
}

export function SplashScreen({
  persistent = false,
  completedSteps,
  totalSteps,
}: SplashScreenProps) {
  const { settings, isLoading: areSettingsLoading } = useGlobalSettings();
  const [instanceId] = useState(() => nextSplashInstanceId++);
  const [isVisible, setIsVisible] = useState(() => (
    persistent || !hasShownSplashForCurrentDocument
  ));
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);
  const [storedLogoUrl, setStoredLogoUrl] = useState<string | null>(null);

  const resolvedTotalSteps = totalSteps && totalSteps > 0 ? totalSteps : 1;
  const resolvedCompletedSteps = completedSteps ?? (areSettingsLoading ? 0 : 1);
  const progress = Math.round(
    (Math.min(Math.max(resolvedCompletedSteps, 0), resolvedTotalSteps) / resolvedTotalSteps) * 100,
  );

  // Configuration from settings
  const backgroundColor = settings.splashBackgroundColor || '#ffffff';
  const logoUrl = settings.splashLogoDataUrl || settings.appLogoDataUrl || storedLogoUrl || DEFAULT_SPLASH_LOGO_URL;
  const animationType = settings.splashAnimationType || 'spinner';

  useEffect(() => {
    setStoredLogoUrl(getStoredSplashLogoUrl());
  }, []);

  useEffect(() => {
    const listener = () => setActiveInstanceId(getActiveSplashInstanceId());

    splashSubscribers.add(listener);

    return () => {
      splashInstances.delete(instanceId);
      splashSubscribers.delete(listener);
      notifySplashSubscribers();
    };
  }, [instanceId]);

  useEffect(() => {
    splashInstances.set(instanceId, { isVisible, persistent });
    setActiveInstanceId(getActiveSplashInstanceId());
    notifySplashSubscribers();
  }, [instanceId, isVisible, persistent]);

  useEffect(() => {
    // If persistent, we keep it visible regardless of sessionStorage or timers
    if (persistent) {
      setIsVisible(true);
      return;
    }

    if (hasShownSplashForCurrentDocument) {
      setIsVisible(false);
      return;
    }

    hasShownSplashForCurrentDocument = true;

    // Hide after allowing content to fully load, but keep this brief
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [persistent]);

  // Listen for manual triggers (e.g., from login flow)
  useEffect(() => {
    const handleShow = () => setIsVisible(true);
    const handleHide = () => setIsVisible(false);

    window.addEventListener('showSplashScreen', handleShow);
    window.addEventListener('hideSplashScreen', handleHide);

    return () => {
      window.removeEventListener('showSplashScreen', handleShow);
      window.removeEventListener('hideSplashScreen', handleHide);
    };
  }, []);

  // Removed early return - show splash screen immediately with defaults while settings load
  // The splash screen will update when settings are fetched

  if (!isVisible || activeInstanceId !== instanceId) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none"
      style={{ backgroundColor }}
    >
          <div className="flex flex-col items-center gap-8 p-4">
            {/* Logo */}
            {logoUrl && (
              <div className="relative w-48 h-24 md:w-64 md:h-32 animate-in fade-in zoom-in-95 duration-300">
                <Image
                  src={logoUrl}
                  alt="App Logo"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 192px, 256px"
                  className="object-contain"
                />
              </div>
            )}

            {/* Animation */}
            <div className="flex flex-col items-center justify-center gap-3">
              {animationType === 'spinner' && (
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              )}
              
              {animationType === 'pulse' && (
                <div className="relative flex items-center justify-center w-12 h-12">
                   <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-20 animate-ping"></span>
                   <span className="relative inline-flex rounded-full h-6 w-6 bg-primary"></span>
                </div>
              )}

              {animationType === 'bar' && (
                <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-primary animate-pulse" />
                </div>
              )}

              {animationType === 'dots' && (
                 <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-3 w-3 rounded-full bg-primary animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                 </div>
              )}

              <div
                className="min-w-12 text-center text-sm font-semibold tabular-nums text-foreground/80"
                role="status"
                aria-live="polite"
                aria-label={`Loading ${progress}%`}
              >
                {progress}%
              </div>
            </div>
          </div>
    </div>
  );
}
