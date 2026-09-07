// src/components/tasks/TaskBoardNavigation.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationButtonProps {
  direction: 'left' | 'right';
  onClick: () => void;
  visible: boolean;
  className?: string;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  direction,
  onClick,
  visible,
  className
}) => {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  const position = direction === 'left' ? 'left-2' : 'right-2';

  if (!visible) return null;

  return (
    <button
      type="button"
      className={cn(
        `absolute ${position} top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-popover/90 text-popover-foreground shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-accent hover:text-accent-foreground hover:shadow-xl`,
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        className
      )}
      onClick={onClick}
      title={direction === 'left' ? 'Previous stage' : 'Next stage'}
      aria-label={`${direction === 'left' ? 'Previous' : 'Next'} stage`}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
};
