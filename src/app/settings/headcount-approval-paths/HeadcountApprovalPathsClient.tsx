'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, GitBranch, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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

interface ApprovalPathsClientProps {
  canEdit: boolean;
  endpoint?: string;
  title?: string;
  description?: string;
  saveMessage?: string;
  newPathName?: string;
  newStepRole?: string;
  newStepTitle?: string;
}

export function HeadcountApprovalPathsClient({
  canEdit,
  endpoint = '/api/settings/headcount-approval-paths',
  title = 'Headcount approval paths',
  description = 'Configure the ordered reviews applied when a headcount request is submitted.',
  saveMessage = 'Approval paths saved',
  newPathName = 'New approval path',
  newStepRole = 'Department lead',
  newStepTitle = 'Business approval',
}: ApprovalPathsClientProps) {
  const [routes, setRoutes] = useState<ApprovalRoute[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selectedRoute = useMemo(
    () => routes.find(route => route.id === selectedId) || routes[0] || null,
    [routes, selectedId],
  );

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(endpoint, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load approval paths');
        const payload = await response.json() as { routes?: ApprovalRoute[] };
        const nextRoutes = payload.routes || [];
        setRoutes(nextRoutes);
        setSelectedId(nextRoutes.find(route => route.isDefault)?.id || nextRoutes[0]?.id || '');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load approval paths');
      } finally {
        setLoading(false);
      }
    })();
  }, [endpoint]);

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
    const id = `route-${Date.now().toString(36)}`;
    const route: ApprovalRoute = {
      id,
      name: newPathName,
      description: '',
      isActive: true,
      isDefault: routes.length === 0,
      steps: [{ role: newStepRole, title: newStepTitle }],
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
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes }),
      });
      const payload = await response.json().catch(() => ({})) as { message?: string; routes?: ApprovalRoute[] };
      if (!response.ok) throw new Error(payload.message || 'Failed to save approval paths');
      if (payload.routes) setRoutes(payload.routes);
      toast.success(saveMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save approval paths');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ApprovalPathsSkeleton />;

  return (
    <main className="min-h-full bg-[#f5f6f9] p-4 text-[#20242c] dark:bg-zinc-950 dark:text-zinc-100 sm:p-5">
      <div className="mx-auto max-w-[1080px] overflow-hidden rounded-[6px] border border-[#dfe2e8] bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe2e8] px-5 py-4 dark:border-zinc-800">
          <div>
            <h1 className="text-base font-semibold">{title}</h1>
            <p className="mt-1 text-xs leading-5 text-[#6f7682] dark:text-zinc-400">{description}</p>
          </div>
          <Button size="sm" disabled={!canEdit || saving} onClick={() => void save()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </header>

        <div className="grid min-h-[560px] lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b border-[#dfe2e8] bg-[#fbfbfc] p-3 dark:border-zinc-800 dark:bg-zinc-950 lg:border-b-0 lg:border-r">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#808793]">Approval paths</span>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={!canEdit} onClick={addRoute} aria-label="Add approval path">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {routes.map(route => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedId(route.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[4px] px-3 py-2.5 text-left',
                    selectedRoute?.id === route.id ? 'bg-[#eaf1fa] text-[#245b9e] dark:bg-blue-950/60 dark:text-blue-200' : 'hover:bg-[#eef1f5] dark:hover:bg-zinc-900',
                  )}
                >
                  <GitBranch className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{route.name}</span>
                    <span className="mt-0.5 block text-[11px] text-[#777c86] dark:text-zinc-400">{route.steps.length} approval step{route.steps.length === 1 ? '' : 's'}</span>
                  </span>
                  {route.isDefault && <Check className="h-3.5 w-3.5 shrink-0" aria-label="Default path" />}
                </button>
              ))}
            </div>
          </aside>

          {selectedRoute && (
            <section className="min-w-0 p-5 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-medium">Path name<Input className="mt-1.5" value={selectedRoute.name} disabled={!canEdit} onChange={event => updateSelected({ name: event.target.value })} /></label>
                <label className="text-xs font-medium">Path ID<Input className="mt-1.5" value={selectedRoute.id} disabled /></label>
              </div>
              <label className="mt-4 block text-xs font-medium">Description<Textarea className="mt-1.5 min-h-20" value={selectedRoute.description} disabled={!canEdit} onChange={event => updateSelected({ description: event.target.value })} /></label>

              <div className="mt-4 flex flex-wrap items-center gap-5 border-y border-[#e8eaf0] py-3 dark:border-zinc-800">
                <label className="flex items-center gap-2 text-xs font-medium"><Checkbox checked={selectedRoute.isActive} disabled={!canEdit || selectedRoute.isDefault} onCheckedChange={checked => updateSelected({ isActive: checked === true })} />Active</label>
                <button type="button" disabled={!canEdit || selectedRoute.isDefault} onClick={setDefault} className="text-xs font-semibold text-primary disabled:text-muted-foreground">
                  {selectedRoute.isDefault ? 'Default path' : 'Set as default'}
                </button>
                <Button type="button" variant="ghost" size="sm" className="ml-auto text-destructive" disabled={!canEdit || routes.length === 1} onClick={removeRoute}><Trash2 className="mr-2 h-4 w-4" />Delete path</Button>
              </div>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div><h2 className="text-sm font-semibold">Approval sequence</h2><p className="mt-1 text-xs text-[#777c86] dark:text-zinc-400">The requester is recorded automatically before these reviewers.</p></div>
                <Button type="button" variant="outline" size="sm" disabled={!canEdit || selectedRoute.steps.length >= 8} onClick={() => updateSelected({ steps: [...selectedRoute.steps, { role: 'Approver', title: 'Review request' }] })}><Plus className="mr-2 h-4 w-4" />Add step</Button>
              </div>

              <div className="mt-3 divide-y divide-[#e8eaf0] border-y border-[#e8eaf0] dark:divide-zinc-800 dark:border-zinc-800">
                {selectedRoute.steps.map((step, index) => (
                  <div key={`${selectedRoute.id}-${index}`} className="grid gap-3 py-4 sm:grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                    <label className="text-xs font-medium">Approver role<Input className="mt-1.5" value={step.role} disabled={!canEdit} onChange={event => updateStep(index, { role: event.target.value })} /></label>
                    <label className="text-xs font-medium">Responsibility<Input className="mt-1.5" value={step.title} disabled={!canEdit} onChange={event => updateStep(index, { title: event.target.value })} /></label>
                    <div className="flex items-center gap-1">
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={!canEdit || index === 0} onClick={() => moveStep(index, -1)} aria-label={`Move ${step.role} up`}><ArrowUp className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={!canEdit || index === selectedRoute.steps.length - 1} onClick={() => moveStep(index, 1)} aria-label={`Move ${step.role} down`}><ArrowDown className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={!canEdit || selectedRoute.steps.length === 1} onClick={() => updateSelected({ steps: selectedRoute.steps.filter((_, stepIndex) => stepIndex !== index) })} aria-label={`Remove ${step.role}`}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function ApprovalPathsSkeleton() {
  return <div className="min-h-full bg-muted/30 p-5"><div className="mx-auto max-w-[1080px] space-y-4"><Skeleton className="h-16 w-full" /><div className="grid gap-4 lg:grid-cols-[260px_1fr]"><Skeleton className="h-[520px]" /><Skeleton className="h-[520px]" /></div></div></div>;
}
