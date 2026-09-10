import type { ComponentType, ReactNode, SVGProps } from 'react';

import { cn } from '@/lib/utils';

interface PageStatusStateProps {
  action?: ReactNode;
  className?: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;
  title: string;
}

export function PageStatusState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: PageStatusStateProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[18rem] flex-col items-center justify-center p-8 text-center',
        className,
      )}
      role="alert"
    >
      <Icon
        aria-hidden="true"
        className="mb-5 h-[4.5rem] w-[4.5rem] text-muted-foreground"
        strokeWidth={1.5}
      />
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      <p className="max-w-md text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
