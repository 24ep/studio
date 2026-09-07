"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CatalogCourse } from './CourseCatalog';
import type { LearningPathItem } from './LearningPathsView';

export function LearningPathDialog({ open, onOpenChange, courses, path, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; courses: CatalogCourse[]; path?: LearningPathItem | null; onSaved: () => void }) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [courseIds, setCourseIds] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTitle(path?.title || ''); setDescription(path?.description || ''); setCourseIds(path?.courseIds || []); setError(null);
  }, [open, path]);

  const toggleCourse = (id: string) => setCourseIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const save = async () => {
    if (!title.trim() || !courseIds.length) { setError('Add a path title and at least one course.'); return; }
    setSaving(true); setError(null);
    try {
      const url = path ? `/api/hr/learning?view=paths&id=${encodeURIComponent(path.id)}` : '/api/hr/learning?view=paths';
      const response = await fetch(url, { method: path ? 'PATCH' : 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: title.trim(), description: description.trim() || null, status: path?.status || 'active', courseIds }) });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to save learning path.');
      onSaved(); onOpenChange(false);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save learning path.'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{path ? 'Edit learning path' : 'Create learning path'}</DialogTitle><DialogDescription>Sequence published courses into a reusable learning journey.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div><Label htmlFor="path-title">Title</Label><Input id="path-title" className="mt-2" value={title} onChange={e => setTitle(e.target.value)} /></div><div><Label htmlFor="path-description">Description</Label><Textarea id="path-description" className="mt-2" value={description} onChange={e => setDescription(e.target.value)} /></div><div><Label>Courses</Label><div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-xl border p-2">{courses.map(course => <label key={course.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted"><input type="checkbox" className="mt-1" checked={courseIds.includes(course.id)} onChange={() => toggleCourse(course.id)} /><span><span className="block text-sm font-semibold">{course.title}</span><span className="block text-xs text-muted-foreground">{course.category || 'Learning'}{course.isRequired ? ' · Required' : ''}</span></span></label>)}</div></div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save path'}</Button></DialogFooter></DialogContent></Dialog>
  );
}
