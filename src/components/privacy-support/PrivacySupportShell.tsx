import { cn } from '@/lib/utils';

export function PrivacySupportShell({
  title,
  eyebrow,
  description,
  hideHeader = false,
  fullPage = false,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  hideHeader?: boolean;
  fullPage?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className={cn(
      'min-h-full w-full text-foreground',
      fullPage
        ? 'h-full min-h-0 bg-background'
        : 'bg-[linear-gradient(120deg,rgba(239,246,255,.75),transparent_38%),hsl(var(--background))] dark:bg-[linear-gradient(120deg,rgba(30,58,138,.12),transparent_38%),hsl(var(--background))]',
    )}>
      <div className={cn('w-full', fullPage ? 'h-full min-h-0' : 'px-4 py-6 sm:px-6 lg:px-8 lg:py-9')}>
        {!hideHeader && <header className="grid gap-5 border-b border-border pb-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
            <h1 className="mt-2 max-w-3xl text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-foreground">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <div className="hidden justify-self-end text-right lg:block">
            <p className="text-xs font-medium text-muted-foreground">Employee center</p>
            <p className="mt-1 text-sm text-foreground">Private, traceable, and available to you</p>
          </div>
        </header>}

        <div className={cn(fullPage && 'h-full min-h-0', !hideHeader && 'mt-6')}>{children}</div>
      </div>
    </main>
  );
}

export function ContentPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('border border-border bg-card', className)}>{children}</section>;
}

export function StatusPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
      tone === 'good' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
      tone === 'warn' && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
      tone === 'bad' && 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
      tone === 'neutral' && 'bg-muted text-muted-foreground',
    )}>{children}</span>
  );
}
