import { cn } from '@/lib/utils';

export function ApplicantSourceOption({ name, description, className }: { name: string; description?: string | null; className?: string }) {
  const mark = name.trim().slice(0, 2).toUpperCase() || 'S';
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">{mark}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{name}</span>
        {description ? <span className="block truncate text-xs text-muted-foreground">{description}</span> : null}
      </span>
    </span>
  );
}
