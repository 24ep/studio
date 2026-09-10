import { ClockIcon } from '@heroicons/react/24/outline';

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

export function ComingSoonPage({
  title,
  description = 'This workspace is being prepared and will be available soon.',
}: ComingSoonPageProps) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-[8px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <ClockIcon className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Coming Soon
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}
