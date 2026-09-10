'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ApprovalStep { role: string; title: string }
interface ApprovalRoute {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  steps: ApprovalStep[];
}

export function CompensationApprovalRoutesClient({ canEdit }: { canEdit: boolean }) {
  const [routes, setRoutes] = useState<ApprovalRoute[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selectedRoute = useMemo(
    () => routes.find(route => route.id === selectedId) || routes[0] || null,
    [routes, selectedId],
  );
  const visibleRoutes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? routes.filter(route => `${route.name} ${route.description}`.toLowerCase().includes(normalized))
      : routes;
  }, [query, routes]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/settings/compensation-approval-routes', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load compensation approval routes');
        const payload = await response.json() as { routes?: ApprovalRoute[] };
        const nextRoutes = payload.routes || [];
        setRoutes(nextRoutes);
        setSelectedId(nextRoutes.find(route => route.isDefault)?.id || nextRoutes[0]?.id || '');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load compensation approval routes');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSelected = (change: Partial<ApprovalRoute>) => {
    if (!selectedRoute) return;
    setRoutes(current => current.map(route => route.id === selectedRoute.id ? { ...route, ...change } : route));
  };

  const updateStep = (index: number, change: Partial<ApprovalStep>) => {
    if (!selectedRoute) return;
    updateSelected({ steps: selectedRoute.steps.map((step, stepIndex) => stepIndex === index ? { ...step, ...change } : step) });
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    if (!selectedRoute) return;
    const target = index + direction;
    if (target < 0 || target >= selectedRoute.steps.length) return;
    const steps = [...selectedRoute.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    updateSelected({ steps });
  };

  const addRoute = () => {
    const id = `compensation-${Date.now().toString(36)}`;
    const route: ApprovalRoute = {
      id,
      name: 'New compensation route',
      description: 'Define when this approval sequence should apply.',
      isActive: true,
      isDefault: routes.length === 0,
      steps: [{ role: 'Compensation approver', title: 'Review compensation changes' }],
    };
    setRoutes(current => [...current, route]);
    setSelectedId(id);
  };

  const removeRoute = () => {
    if (!selectedRoute || routes.length === 1) return;
    const remaining = routes.filter(route => route.id !== selectedRoute.id);
    if (selectedRoute.isDefault && remaining[0]) remaining[0] = { ...remaining[0], isDefault: true, isActive: true };
    setRoutes(remaining);
    setSelectedId(remaining[0]?.id || '');
  };

  const setDefault = () => {
    if (!selectedRoute) return;
    setRoutes(current => current.map(route => ({
      ...route,
      isDefault: route.id === selectedRoute.id,
      isActive: route.id === selectedRoute.id ? true : route.isActive,
    })));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/compensation-approval-routes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes }),
      });
      const payload = await response.json().catch(() => ({})) as { message?: string; routes?: ApprovalRoute[] };
      if (!response.ok) throw new Error(payload.message || 'Failed to save compensation approval routes');
      if (payload.routes) setRoutes(payload.routes);
      toast.success('Compensation approval routes saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save compensation approval routes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <RouteCanvasSkeleton />;
  if (!selectedRoute) return null;

  return (
    <main className="min-h-full bg-background dark:bg-[#0b1119] p-3 text-foreground dark:text-[#e8edf4] sm:p-4">
      <div className="mx-auto grid min-h-[720px] max-w-[1120px] overflow-hidden rounded-[6px] border border-border dark:border-[#273240] bg-card dark:bg-[#101821] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-border dark:border-[#273240] bg-muted/40 dark:bg-[#0d151e] lg:border-b-0 lg:border-r">
          <div className="border-b border-border dark:border-[#273240] p-4">
            <h1 className="text-sm font-semibold text-foreground dark:text-white">Approval routes</h1>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-[#718096]" />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search routes"
                aria-label="Search approval routes"
                className="h-9 border-border bg-background pl-9 text-xs text-foreground placeholder:text-muted-foreground dark:border-[#334150] dark:bg-[#111c27] dark:text-white dark:placeholder:text-[#718096]"
              />
            </div>
            <Button type="button" className="mt-2 h-9 w-full bg-blue-600 text-xs text-white hover:bg-blue-500" disabled={!canEdit} onClick={addRoute}>
              <Plus className="mr-2 h-4 w-4" />New route
            </Button>
          </div>

          <nav aria-label="Compensation approval routes" className="divide-y divide-border dark:divide-[#273240]">
            {visibleRoutes.map(route => (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedId(route.id)}
                className={cn(
                  'group flex w-full items-center gap-3 px-4 py-4 text-left transition-colors',
                  selectedRoute.id === route.id
                    ? 'border-l-2 border-blue-400 bg-info/10 dark:bg-[#172a47] pl-[14px]'
                    : 'border-l-2 border-transparent hover:bg-muted dark:hover:bg-[#141f2b]',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground dark:text-white">{route.name}</span>
                  <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground dark:text-[#8d9caf]">
                    <span className={cn('h-2 w-2 rounded-full', route.isDefault ? 'bg-emerald-400' : route.isActive ? 'bg-blue-400' : 'bg-slate-500')} />
                    {route.isDefault ? 'Default route' : route.isActive ? 'Custom route' : 'Inactive'}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground dark:text-[#718096]">{route.steps.length} approval step{route.steps.length === 1 ? '' : 's'}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground dark:text-[#728196] transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-border dark:border-[#273240] px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-[-0.01em] text-foreground dark:text-white">{selectedRoute.name}</h2>
                {selectedRoute.isDefault && <span className="rounded-[3px] border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Default route</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground dark:text-[#8d9caf]">Configure the ordered reviews applied when a compensation cycle is submitted.</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground dark:text-[#d8e0ea]">
                Active
                <Switch checked={selectedRoute.isActive} disabled={!canEdit || selectedRoute.isDefault} onCheckedChange={checked => updateSelected({ isActive: checked })} />
              </label>
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500" disabled={!canEdit || saving} onClick={() => void save()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </header>

          <section className="border-b border-border dark:border-[#273240] px-5 py-5">
            <div className="flex items-end justify-between gap-4">
              <div><h3 className="text-sm font-semibold text-foreground dark:text-white">Approval sequence</h3><p className="mt-1 text-xs text-muted-foreground dark:text-[#8d9caf]">Approvals occur in the order shown.</p></div>
            </div>

            <div className="mt-5 flex snap-x gap-2 overflow-x-auto pb-2">
              {selectedRoute.steps.map((step, index) => (
                <div key={`${selectedRoute.id}-${index}`} className="flex shrink-0 snap-start items-center gap-2">
                  <article className="w-[184px] overflow-hidden rounded-[5px] border border-border dark:border-[#344353] bg-background dark:bg-[#111c27]">
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>
                        <Input aria-label={`Responsibility for step ${index + 1}`} value={step.title} disabled={!canEdit} onChange={event => updateStep(index, { title: event.target.value })} className="h-8 border-0 bg-transparent px-0 text-xs font-semibold text-foreground focus-visible:ring-0 dark:text-white" />
                      </div>
                      <label className="mt-4 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground dark:text-[#718096]">Approver role</label>
                      <div className="mt-1 flex items-center gap-2 text-xs text-foreground/80 dark:text-[#d6dee8]"><UserRound className="h-4 w-4 text-blue-700 dark:text-blue-400" /><Input aria-label={`Approver role for step ${index + 1}`} value={step.role} disabled={!canEdit} onChange={event => updateStep(index, { role: event.target.value })} className="h-8 border-0 bg-transparent px-0 text-xs focus-visible:ring-0" /></div>
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-border dark:divide-[#344353] border-t border-border dark:border-[#344353]">
                      <span className="grid h-9 place-items-center text-muted-foreground dark:text-[#718096]"><GripVertical className="h-4 w-4" /></span>
                      <button type="button" disabled={!canEdit || index === 0} onClick={() => moveStep(index, -1)} className="grid h-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-25 dark:text-[#8d9caf] dark:hover:text-white" aria-label={`Move ${step.title} left`}><ArrowUp className="h-4 w-4 -rotate-90" /></button>
                      <button type="button" disabled={!canEdit || index === selectedRoute.steps.length - 1} onClick={() => moveStep(index, 1)} className="grid h-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-25 dark:text-[#8d9caf] dark:hover:text-white" aria-label={`Move ${step.title} right`}><ArrowDown className="h-4 w-4 -rotate-90" /></button>
                      <button type="button" disabled={!canEdit || selectedRoute.steps.length === 1} onClick={() => updateSelected({ steps: selectedRoute.steps.filter((_, stepIndex) => stepIndex !== index) })} className="grid h-9 place-items-center text-rose-600 hover:bg-rose-500/10 disabled:opacity-25 dark:text-rose-400" aria-label={`Remove ${step.title}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </article>
                  {index < selectedRoute.steps.length - 1 && <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground dark:text-[#8190a4]" />}
                </div>
              ))}
              <button type="button" disabled={!canEdit || selectedRoute.steps.length >= 8} onClick={() => updateSelected({ steps: [...selectedRoute.steps, { role: 'Approver', title: 'Review request' }] })} className="flex min-h-[184px] w-[145px] shrink-0 flex-col items-center justify-center rounded-[5px] border border-dashed border-border text-xs text-muted-foreground transition hover:border-blue-500 hover:text-blue-700 disabled:opacity-40 dark:border-[#526174] dark:text-[#a4b0bf] dark:hover:text-blue-300"><Plus className="mb-3 h-6 w-6" />Add approval step</button>
            </div>
          </section>

          <div className="grid md:grid-cols-2">
            <section className="border-b border-border dark:border-[#273240] p-5 md:border-b-0 md:border-r">
              <h3 className="text-sm font-semibold text-foreground dark:text-white">Route details</h3>
              <div className="mt-4 space-y-4">
                <label className="block text-xs font-medium text-foreground/80 dark:text-[#cbd4df]">Path name<Input className="mt-1.5 h-9 border-border dark:border-[#344353] bg-background dark:bg-[#111c27] text-xs" value={selectedRoute.name} disabled={!canEdit} onChange={event => updateSelected({ name: event.target.value })} /></label>
                <label className="block text-xs font-medium text-foreground/80 dark:text-[#cbd4df]">Path ID<Input className="mt-1.5 h-9 border-border dark:border-[#344353] bg-background dark:bg-[#111c27] text-xs text-muted-foreground dark:text-[#8290a3]" value={selectedRoute.id} disabled /></label>
                <label className="block text-xs font-medium text-foreground/80 dark:text-[#cbd4df]">Description<Textarea className="mt-1.5 min-h-24 border-border dark:border-[#344353] bg-background dark:bg-[#111c27] text-xs" value={selectedRoute.description} disabled={!canEdit} onChange={event => updateSelected({ description: event.target.value })} /></label>
              </div>
            </section>

            <section className="border-b border-border dark:border-[#273240] p-5 md:border-b-0">
              <h3 className="text-sm font-semibold text-foreground dark:text-white">Submission behavior</h3>
              <dl className="mt-4 divide-y divide-border dark:divide-[#273240] text-xs">
                <div className="pb-4"><dt className="font-medium text-foreground/80 dark:text-[#cbd4df]">Requester record</dt><dd className="mt-1 leading-5 text-muted-foreground dark:text-[#8d9caf]">The requester is recorded automatically before these reviewers.</dd></div>
                <div className="py-4"><dt className="font-medium text-foreground/80 dark:text-[#cbd4df]">Step reassignment</dt><dd className="mt-1 leading-5 text-muted-foreground dark:text-[#8d9caf]">Route owners can reassign a pending step before final approval.</dd></div>
                <div className="pt-4"><dt className="font-medium text-foreground/80 dark:text-[#cbd4df]">Completion policy</dt><dd className="mt-1 leading-5 text-muted-foreground dark:text-[#8d9caf]">Every step in the sequence must be approved.</dd></div>
              </dl>
              {!selectedRoute.isDefault && <Button type="button" variant="outline" size="sm" className="mt-5 border-border dark:border-[#344353] bg-transparent text-xs text-foreground dark:text-[#d7e0eb]" disabled={!canEdit} onClick={setDefault}><Check className="mr-2 h-4 w-4" />Set as default route</Button>}
            </section>
          </div>

          <footer className="flex items-center justify-between border-t border-border dark:border-[#273240] px-5 py-4">
            <Button type="button" variant="outline" size="sm" className="border-rose-500/50 bg-transparent text-rose-700 hover:bg-rose-500/10 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300" disabled={!canEdit || routes.length === 1} onClick={removeRoute}><Trash2 className="mr-2 h-4 w-4" />Delete route</Button>
            <span className="text-[11px] text-muted-foreground dark:text-[#718096]">{routes.length} route{routes.length === 1 ? '' : 's'} configured</span>
          </footer>
        </section>
      </div>
    </main>
  );
}

function RouteCanvasSkeleton() {
  return <div className="min-h-full bg-background dark:bg-[#0b1119] p-4"><div className="mx-auto grid min-h-[720px] max-w-[1120px] overflow-hidden rounded-[6px] border border-border dark:border-[#273240] bg-card dark:bg-[#101821] lg:grid-cols-[250px_1fr]"><aside className="space-y-3 border-r border-border dark:border-[#273240] p-4"><Skeleton className="h-5 w-28"/><Skeleton className="h-9 w-full"/><Skeleton className="h-9 w-full"/><Skeleton className="mt-6 h-20 w-full"/><Skeleton className="h-20 w-full"/></aside><main className="space-y-5 p-5"><Skeleton className="h-14 w-full"/><Skeleton className="h-56 w-full"/><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-72 w-full"/><Skeleton className="h-72 w-full"/></div></main></div></div>;
}
