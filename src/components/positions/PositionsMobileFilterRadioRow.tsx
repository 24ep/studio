"use client";

import { cn } from '@/lib/utils';

interface MobileRadioRowProps {
  label: string;
  selected: boolean;
  withBorder?: boolean;
  onSelect: () => void;
}

export function PositionsMobileFilterRadioRow({
  label,
  selected,
  withBorder,
  onSelect,
}: MobileRadioRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors active:bg-muted/50',
        selected ? 'bg-primary/5' : 'bg-background',
        withBorder && 'border-b'
      )}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="text-sm">{label}</span>
      <div
        className={cn(
          'h-5 w-5 rounded-full border flex items-center justify-center flex-shrink-0',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
        )}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
      </div>
    </div>
  );
}
