"use client";

import * as React from 'react';
import { Check, ChevronDown, ChevronRight, FolderTree, Loader2, Plus, Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  getLearningCourseCategoryChildren,
  type LearningCourseCategory,
  parseLearningCourseCategories,
} from '@/lib/learning-course-categories';
import { cn } from '@/lib/utils';

export function LearningCategoriesClient({ canEdit }: { canEdit: boolean }) {
  const [categories, setCategories] = React.useState<LearningCourseCategory[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError] = React.useState('');

  const selected = categories.find(category => category.id === selectedId) || null;
  const activeCount = categories.filter(category => category.isActive).length;

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/settings/system-settings?keys=learningCourseCategories', { cache: 'no-store' });
      const payload = await response.json() as { learningCourseCategories?: string };
      if (!response.ok) throw new Error('Unable to load course categories.');
      const loaded = parseLearningCourseCategories(payload.learningCourseCategories);
      setCategories(loaded);
      setSelectedId(current => current && loaded.some(category => category.id === current) ? current : loaded[0]?.id || null);
      setExpandedIds(new Set(loaded.filter(category => category.parentId === null).map(category => category.id)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load course categories.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadCategories(); }, [loadCategories]);

  async function saveCategories() {
    setIsSaving(true);
    setStatus('idle');
    setError('');
    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ key: 'learningCourseCategories', value: JSON.stringify(categories) }]),
      });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to save course categories.');
      setStatus('saved');
    } catch (saveError) {
      setStatus('error');
      setError(saveError instanceof Error ? saveError.message : 'Unable to save course categories.');
    } finally {
      setIsSaving(false);
    }
  }

  function addCategory(parentId: string | null) {
    const id = `course-category-${Date.now()}`;
    const siblingCount = categories.filter(category => category.parentId === parentId).length;
    const category: LearningCourseCategory = { id, name: '', parentId, isActive: true, sortOrder: (siblingCount + 1) * 10 };
    setCategories(current => [...current, category]);
    setSelectedId(id);
    if (parentId) setExpandedIds(current => new Set(current).add(parentId));
    setStatus('idle');
  }

  function updateSelected(updates: Partial<LearningCourseCategory>) {
    if (!selectedId) return;
    setCategories(current => current.map(category => category.id === selectedId ? { ...category, ...updates } : category));
    setStatus('idle');
  }

  function deleteSelected() {
    if (!selected) return;
    if (categories.some(category => category.parentId === selected.id)) {
      setError('Move or delete this category’s child categories first.');
      return;
    }
    setCategories(current => current.filter(category => category.id !== selected.id));
    setSelectedId(categories.find(category => category.id !== selected.id)?.id || null);
    setStatus('idle');
  }

  const parentOptions = categories.filter(category => (
    category.id !== selected?.id && !isDescendantOf(category.id, selected?.id || null, categories)
  ));

  return (
    <main className="min-h-full bg-[#f5f6f9] p-4 text-[#20242c] dark:bg-zinc-950 dark:text-zinc-100 sm:p-5">
      <div className="w-full space-y-4">
        <header className="flex flex-col gap-4 border-b border-[#dfe2e8] pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#315f9f] dark:text-blue-300">HR setup · Learning</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Course category hierarchy</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#727782] dark:text-zinc-400">Create the structure HR uses to keep the course catalog consistent. Courses can select active categories from this tree.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={() => void loadCategories()} disabled={isLoading || isSaving}>Refresh</Button>
            {canEdit && <Button type="button" onClick={() => void saveCategories()} disabled={isLoading || isSaving || categories.some(category => !category.name.trim())}><Save className="mr-2 h-4 w-4" />{isSaving ? 'Saving…' : 'Save changes'}</Button>}
          </div>
        </header>

        {(error || status === 'saved') && (
          <div role="status" className={cn('rounded-[6px] border px-3 py-2 text-sm', error || status === 'error' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300')}>
            {error || <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />Course category changes saved.</span>}
          </div>
        )}

        <section className="grid overflow-hidden rounded-[6px] border border-[#dfe2e8] bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3">
          <Summary label="Categories" value={categories.length} helper="Configured nodes" />
          <Summary label="Active" value={activeCount} helper="Available to courses" />
          <Summary label="Structure" value={categories.filter(category => category.parentId === null).length} helper="Top-level groups" />
        </section>

        <section className="grid min-h-[520px] overflow-hidden rounded-[6px] border border-[#dfe2e8] bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          <div className="border-b border-[#dfe2e8] bg-[#fbfbfc] dark:border-zinc-800 dark:bg-zinc-950 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-[#dfe2e8] px-4 py-3 dark:border-zinc-800">
              <div><h2 className="text-sm font-semibold">Category tree</h2><p className="mt-0.5 text-xs text-[#727782] dark:text-zinc-400">Select a node to edit it</p></div>
              {canEdit && <Button type="button" size="icon" variant="outline" aria-label="Add top-level category" onClick={() => addCategory(null)}><Plus className="h-4 w-4" /></Button>}
            </div>
            <div className="p-3">
              {isLoading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading categories…</div> : categories.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground"><FolderTree className="mx-auto h-8 w-8" /><p className="mt-3">No categories configured.</p></div> : <div className="space-y-1">{getLearningCourseCategoryChildren(null, categories, true).map(category => <CategoryTreeNode key={category.id} category={category} categories={categories} selectedId={selectedId} expandedIds={expandedIds} onSelect={setSelectedId} onToggle={(id) => setExpandedIds(current => toggleSet(current, id))} />)}</div>}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {selected ? (
              <div className="max-w-xl">
                <div className="border-b border-[#e6e8ed] pb-4 dark:border-zinc-800"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#315f9f] dark:text-blue-300">Edit category</p><h2 className="mt-1 text-lg font-semibold">{selected.name || 'New category'}</h2><p className="mt-1 text-xs text-[#727782] dark:text-zinc-400">Category names appear in the course selection tree.</p></div>
                <fieldset disabled={!canEdit || isSaving} className="mt-5 grid gap-5">
                  <div className="grid gap-2"><Label htmlFor="course-category-name">Name</Label><Input id="course-category-name" value={selected.name} onChange={event => updateSelected({ name: event.target.value })} placeholder="For example, Safety" autoFocus /></div>
                  <div className="grid gap-2"><Label htmlFor="course-category-parent">Parent category</Label><select id="course-category-parent" value={selected.parentId || 'root'} onChange={event => updateSelected({ parentId: event.target.value === 'root' ? null : event.target.value })} className="min-h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="root">Top level</option>{parentOptions.map(category => <option key={category.id} value={category.id}>{getCategoryPath(category.id, categories)}</option>)}</select></div>
                  <div className="grid gap-2"><Label htmlFor="course-category-order">Display order</Label><Input id="course-category-order" type="number" min="0" step="10" value={selected.sortOrder} onChange={event => updateSelected({ sortOrder: Number(event.target.value) || 0 })} /></div>
                  <label className="flex items-center justify-between gap-4 rounded-[6px] border border-[#e2e5ea] px-3 py-3 dark:border-zinc-700"><span><span className="block text-sm font-medium">Available for course selection</span><span className="mt-0.5 block text-xs text-[#727782] dark:text-zinc-400">Inactive categories stay in the configuration for existing courses.</span></span><Switch checked={selected.isActive} onCheckedChange={isActive => updateSelected({ isActive })} /></label>
                </fieldset>
                <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-[#e6e8ed] pt-4 dark:border-zinc-800">
                  <div className="flex gap-2">{canEdit && <Button type="button" variant="outline" onClick={() => addCategory(selected.id)}><Plus className="mr-2 h-4 w-4" />Add child</Button>}{canEdit && <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700" onClick={deleteSelected}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>}</div>
                  {!canEdit && <p className="text-xs text-muted-foreground">You have view-only access to HR Setup.</p>}
                </div>
              </div>
            ) : <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center text-muted-foreground"><FolderTree className="h-9 w-9" /><p className="mt-3 text-sm font-medium">Select a category</p><p className="mt-1 max-w-sm text-xs">Choose a node from the tree to review or update its configuration.</p></div>}
          </div>
        </section>
      </div>
    </main>
  );
}

function CategoryTreeNode({ category, categories, selectedId, expandedIds, onSelect, onToggle }: { category: LearningCourseCategory; categories: LearningCourseCategory[]; selectedId: string | null; expandedIds: Set<string>; onSelect: (id: string) => void; onToggle: (id: string) => void }) {
  const children = getLearningCourseCategoryChildren(category.id, categories, true);
  const expanded = expandedIds.has(category.id);
  return <div><div className={cn('group flex items-center gap-1 rounded-[4px] px-2 py-2 text-sm transition-colors', selectedId === category.id ? 'bg-[#eaf1fa] text-[#245b9e] dark:bg-blue-950/60 dark:text-blue-200' : 'hover:bg-[#eef1f5] dark:hover:bg-zinc-900')}><button type="button" className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-black/5" onClick={() => children.length && onToggle(category.id)} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name}`}>{children.length ? (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="h-1 w-1 rounded-full bg-current opacity-40" />}</button><button type="button" className="min-w-0 flex-1 truncate text-left font-medium" onClick={() => onSelect(category.id)}>{category.name || 'Unnamed category'}</button>{!category.isActive && <span className="text-[10px] font-semibold uppercase text-muted-foreground">Off</span>}</div>{expanded && children.length > 0 && <div className="ml-5 border-l border-[#dfe2e8] pl-2 dark:border-zinc-700">{children.map(child => <CategoryTreeNode key={child.id} category={child} categories={categories} selectedId={selectedId} expandedIds={expandedIds} onSelect={onSelect} onToggle={onToggle} />)}</div>}</div>;
}

function Summary({ label, value, helper }: { label: string; value: number; helper: string }) { return <div className="border-b border-[#e6e8ed] px-4 py-3 last:border-b-0 dark:border-zinc-800 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p><p className="text-[11px] text-muted-foreground">{helper}</p></div>; }

function toggleSet(set: Set<string>, id: string) { const next = new Set(set); if (next.has(id)) next.delete(id); else next.add(id); return next; }
function getCategoryPath(id: string, categories: LearningCourseCategory[]) { const names: string[] = []; let current = categories.find(category => category.id === id); const seen = new Set<string>(); while (current && !seen.has(current.id)) { seen.add(current.id); names.unshift(current.name || 'Unnamed'); current = current.parentId ? categories.find(category => category.id === current?.parentId) : undefined; } return names.join(' / '); }
function isDescendantOf(candidateId: string, ancestorId: string | null, categories: LearningCourseCategory[]) { if (!ancestorId) return false; let current = categories.find(category => category.id === candidateId); const seen = new Set<string>(); while (current?.parentId && !seen.has(current.id)) { if (current.parentId === ancestorId) return true; seen.add(current.id); current = categories.find(category => category.id === current?.parentId); } return false; }
