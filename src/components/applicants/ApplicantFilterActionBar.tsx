import type { ComponentType } from 'react';

import { Button } from '@/components/ui/button';

interface ApplicantFilterActionBarProps {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryIcon: ComponentType<{ className?: string }>;
  secondaryIcon: ComponentType<{ className?: string }>;
  disabledPrimary?: boolean;
  stickyMobile?: boolean;
  secondaryFirst?: boolean;
  className?: string;
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonClassName?: string;
}

export function ApplicantFilterActionBar({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryIcon: PrimaryIcon,
  secondaryIcon: SecondaryIcon,
  disabledPrimary = false,
  stickyMobile = false,
  secondaryFirst = false,
  className,
  buttonSize = 'default',
  buttonClassName = 'flex-1 h-12',
}: ApplicantFilterActionBarProps) {
  const primaryButton = (
    <Button
      onClick={onPrimary}
      disabled={disabledPrimary}
      size={buttonSize}
      className={buttonClassName}
    >
      <PrimaryIcon className="mr-2 h-4 w-4" />
      {primaryLabel}
    </Button>
  );
  const secondaryButton = (
    <Button
      variant="outline"
      onClick={onSecondary}
      size={buttonSize}
      className={buttonClassName}
    >
      <SecondaryIcon className="mr-2 h-4 w-4" />
      {secondaryLabel}
    </Button>
  );

  return (
    <div className={className || (stickyMobile ? 'fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg z-50 md:hidden' : 'p-4 border-t bg-card')}>
      <div className="flex gap-2">
        {secondaryFirst ? secondaryButton : primaryButton}
        {secondaryFirst ? primaryButton : secondaryButton}
      </div>
    </div>
  );
}
