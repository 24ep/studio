"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useToastManager } from '@/hooks/use-toast-manager';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ToastClearButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

export function ToastClearButton({ 
  variant = 'ghost', 
  size = 'icon',
  showIcon = true,
  showText = false,
  className = ''
}: ToastClearButtonProps) {
  const { dismiss } = useToast();
  const { clearAll } = useToastManager();

  const handleClearToasts = () => {
    clearAll();
  };

  if (size === 'icon' || !showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleClearToasts}
              className={`${className}`}
              aria-label="Clear all toasts"
            >
              {showIcon && <X className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear all toasts</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClearToasts}
      className={`${className}`}
    >
      {showIcon && <Trash2 className="h-4 w-4 mr-2" />}
      Clear Toasts
    </Button>
  );
}

// Hook for programmatic toast clearing
export function useToastClear() {
  const { dismiss } = useToast();
  const { clearAll } = useToastManager();

  return {
    clearAll,
    dismiss,
  };
}
