"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Building2, Check, Loader2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BranchConfigForm } from './BranchConfigForm';
import {
  emptyBranch,
  starterBranches,
  type BranchConfigItem,
  type BranchConfigResponse,
  type BranchSaveStatus,
} from './branch-config-model';

export function BranchConfigClient() {
  const [branches, setBranches] = useState<BranchConfigItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<BranchSaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastSavedSnapshot = useRef('');
  const branchesRef = useRef(branches);
  branchesRef.current = branches;

  const selectedBranch = useMemo(
    () => branches.find(branch => branch.id === selectedId) || branches[0] || null,
    [branches, selectedId],
  );
  const activeCount = branches.filter(branch => branch.isActive).length;

  useEffect(() => {
    let isMounted = true;

    async function loadBranches() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/settings/branches', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({})) as BranchConfigResponse;
        if (!response.ok) throw new Error(payload.message || 'Failed to load branch config');

        const nextBranches = payload.branches?.length ? payload.branches : starterBranches;
        if (!isMounted) return;
        lastSavedSnapshot.current = JSON.stringify(nextBranches);
        setBranches(nextBranches);
        setSelectedId(nextBranches[0]?.id ?? null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load branch config');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadBranches();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const snapshot = JSON.stringify(branches);
    if (snapshot === lastSavedSnapshot.current) return;

    const invalidBranch = branches.find(branch => !branch.name.trim() || !branch.code.trim());
    if (invalidBranch) {
      setSaveStatus('invalid');
      return;
    }

    setSaveStatus('pending');
    setError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const response = await fetch('/api/settings/branches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branches }),
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({})) as BranchConfigResponse;
        if (!response.ok) throw new Error(payload.message || 'Failed to save branch config');

        lastSavedSnapshot.current = JSON.stringify(payload.branches || branches);
        if (JSON.stringify(branchesRef.current) === snapshot) setSaveStatus('saved');
      } catch (saveError) {
        if (controller.signal.aborted) return;
        setSaveStatus('error');
        setError(saveError instanceof Error ? saveError.message : 'Failed to save branch config');
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [branches, isLoading]);

  function updateBranch(id: string, updates: Partial<BranchConfigItem>) {
    setBranches(current => current.map(branch => (
      branch.id === id ? { ...branch, ...updates } : branch
    )));
  }

  function addBranch() {
    const branch = emptyBranch();
    setBranches(current => [...current, branch]);
    setSelectedId(branch.id);
  }

  function removeBranch(id: string) {
    setBranches(current => {
      const remaining = current.filter(branch => branch.id !== id);
      if (remaining.length > 0 && !remaining.some(branch => branch.isDefault)) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }
      setSelectedId(remaining[0]?.id ?? null);
      return remaining;
    });
  }

  function setDefaultBranch(id: string) {
    setBranches(current => current.map(branch => ({
      ...branch,
      isDefault: branch.id === id,
      isActive: branch.id === id ? true : branch.isActive,
    })));
  }

  return (
    <main className="min-h-full bg-[#f5f6f9] p-4 text-[#20242c] dark:bg-zinc-950 dark:text-zinc-100 sm:p-5">
      <div className="w-full">
        {error && (
          <div className="mb-4 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="min-h-[calc(100vh-8rem)] overflow-hidden rounded-[6px] border border-[#dfe2e8] bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <aside className="border-b border-[#dfe2e8] bg-[#fbfbfc] dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-[#dfe2e8] px-4 py-3 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-semibold">Branches</h2>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[#727782] dark:text-zinc-400">
                  <span>{activeCount} active of {branches.length}</span>
                  <AutoSaveStatus status={saveStatus} />
                </div>
              </div>
              <Button type="button" size="icon" variant="outline" aria-label="Add branch" onClick={addBranch}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-4">
              {isLoading ? (
                <div className="p-3 text-sm text-[#727782]">Loading branches...</div>
              ) : branches.length === 0 ? (
                <button type="button" className="w-full rounded-[6px] border border-dashed p-4 text-sm text-[#727782]" onClick={addBranch}>
                  Add your first branch
                </button>
              ) : (
                branches.map(branch => (
                  <button
                    key={branch.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[6px] border p-3 text-left transition',
                      selectedBranch?.id === branch.id
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40'
                        : 'border-transparent hover:border-[#dfe2e8] hover:bg-white dark:hover:border-zinc-800 dark:hover:bg-zinc-800',
                    )}
                    onClick={() => setSelectedId(branch.id)}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[5px] bg-white text-[#2563b6] shadow-sm dark:bg-zinc-800">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{branch.name || 'Untitled branch'}</span>
                      <span className="block truncate text-xs text-[#727782]">{branch.code || 'No code'} · {branch.city || 'No city'}</span>
                    </span>
                    {branch.isDefault && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="p-4 sm:p-6">
            {selectedBranch ? (
              <BranchConfigForm
                branch={selectedBranch}
                canRemove={branches.length > 1}
                onChange={(updates) => updateBranch(selectedBranch.id, updates)}
                onRemove={() => removeBranch(selectedBranch.id)}
                onSetDefault={() => setDefaultBranch(selectedBranch.id)}
              />
            ) : (
              <div className="grid h-full min-h-[360px] place-items-center rounded-[6px] border border-dashed text-sm text-[#727782]">
                Select or add a branch to configure it.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function AutoSaveStatus({ status }: { status: BranchSaveStatus }) {
  if (status === 'idle') return null;

  const content = {
    pending: { icon: null, label: 'Unsaved changes', className: 'text-[#727782] dark:text-zinc-400' },
    saving: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Saving', className: 'text-[#2563b6] dark:text-blue-400' },
    saved: { icon: <Check className="h-3 w-3" />, label: 'Saved', className: 'text-emerald-600 dark:text-emerald-400' },
    invalid: { icon: <AlertCircle className="h-3 w-3" />, label: 'Name and code required', className: 'text-amber-700 dark:text-amber-400' },
    error: { icon: <AlertCircle className="h-3 w-3" />, label: 'Save failed', className: 'text-red-600 dark:text-red-400' },
  }[status];

  return (
    <span className={cn('inline-flex items-center gap-1', content.className)} aria-live="polite">
      {content.icon}
      {content.label}
    </span>
  );
}
