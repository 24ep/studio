import type React from 'react';

export function AutoCloseSectionHeader({
  description,
  icon,
  title,
}: {
  description?: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="text-left">
        <div className="font-semibold">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground font-normal">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
