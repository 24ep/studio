"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export type LoadingSize = 'sm' | 'md' | 'lg';

const loadingSpinnerSizeClasses: Record<LoadingSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  size?: LoadingSize;
  variant?: 'overlay' | 'inline' | 'skeleton';
  className?: string;
  children?: React.ReactNode;
}

export function LoadingSpinner({
  size = 'md',
  text,
}: {
  size?: LoadingSize;
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={cn('animate-spin text-primary', loadingSpinnerSizeClasses[size])} />
      {text && (
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {text}
        </p>
      )}
    </div>
  );
}

export function LoadingOverlay({
  isLoading,
  text = 'Loading...',
  size = 'md',
  variant = 'overlay',
  className,
  children,
}: LoadingOverlayProps) {
  const spinner = <LoadingSpinner size={size} text={text} />;

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        {spinner}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 bg-muted rounded mb-2" />
        <div className="h-4 bg-muted rounded mb-2 w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      <div
        className={cn(
          'absolute inset-0 z-50 flex items-center justify-center',
          'bg-black/20 backdrop-blur-sm',
          'transition-opacity duration-200',
          className,
        )}
        role="status"
        aria-live="polite"
        aria-label={text}
      >
        {spinner}
      </div>
    </div>
  );
}
