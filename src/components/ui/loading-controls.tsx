"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { LoadingSize } from './loading-overlay-core';

export function PageLoading({
  text = 'Loading page...',
  size = 'lg',
}: {
  text?: string;
  size?: LoadingSize;
}) {
  return (
    <div className="min-flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className={cn(
          'animate-spin text-primary mx-auto',
          size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-12 w-12',
        )} />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

export function LoadingButton({
  isLoading,
  children,
  loadingText = 'Loading...',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      {...props}
      type={props.type || 'button'}
      disabled={isLoading || props.disabled}
      className={cn(
        'inline-flex items-center justify-center',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        props.className,
      )}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {isLoading ? loadingText : children}
    </button>
  );
}
