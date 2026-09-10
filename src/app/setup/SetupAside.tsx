import { BriefcaseBusiness, ShieldCheck, Sparkles } from 'lucide-react';

const highlights = [
  [ShieldCheck, 'Secure ownership', 'Only the first administrator can complete this setup.'],
  [BriefcaseBusiness, 'Recruiting ready', 'Start with the workflows your team uses every day.'],
  [Sparkles, 'Guided defaults', 'Initialize each platform feature after sign-in.'],
] as const;

export function SetupAside() {
  return (
    <aside className="relative overflow-hidden bg-primary px-6 py-8 text-primary-foreground sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12">
      <div className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full border border-primary-foreground/20" />
      <div className="pointer-events-none absolute -right-12 top-36 h-44 w-44 rounded-full border border-primary-foreground/15" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-md bg-primary-foreground text-primary">h</span>hrive</div>
        <div className="mt-10 max-w-md lg:mt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">First-run setup</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-4xl">Build the foundation for better hiring.</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/80">Create the first administrator, choose an environment, connect an AI provider, and take a quick product tour.</p>
        </div>
      </div>
      <div className="relative mt-10 grid gap-3 text-sm sm:grid-cols-3 lg:mt-16 lg:grid-cols-1">
        {highlights.map(([Icon, title, description]) => (
          <div key={title} className="flex items-start gap-3 border-t border-primary-foreground/20 pt-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-foreground/80" />
            <div><p className="font-semibold">{title}</p><p className="mt-0.5 text-xs leading-5 text-primary-foreground/75">{description}</p></div>
          </div>
        ))}
      </div>
    </aside>
  );
}
