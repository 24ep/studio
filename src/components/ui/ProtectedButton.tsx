"use client";

import React from 'react';
import { Button } from './button';
import { useClickProtection } from '@/hooks/use-click-protection';
import { ButtonHTMLAttributes } from 'react';

interface ProtectedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  actionName?: string;
  debounceMs?: number;
  timeoutMs?: number;
  onBlocked?: () => void;
  onExcessiveClicks?: () => void;
  children: React.ReactNode;
}

export const ProtectedButton = React.forwardRef<HTMLButtonElement, ProtectedButtonProps>(
  ({ 
    onClick, 
    actionName = 'button',
    debounceMs = 200,
    timeoutMs = 500,
    onBlocked,
    onExcessiveClicks,
    disabled,
    children,
    ...props 
  }, ref) => {
    const { isActioning, handleProtectedClick } = useClickProtection({
      debounceMs,
      timeoutMs,
      actionName,
      onBlocked,
      onExcessiveClicks
    });

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        handleProtectedClick(() => onClick(e));
      }
    }, [onClick, handleProtectedClick]);

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || isActioning}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

ProtectedButton.displayName = 'ProtectedButton';
