"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export function CourseCreateDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [durationHours, setDurationHours] = React.useState('1');
  const [isRequired, setIsRequired] = React.useState(false);
  const [lessonTitle, setLessonTitle] = React.useState('Introduction');
  const [lessonContent, setLessonContent] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const create = async () => {
    if (!title.trim() || !lessonTitle.trim() || !lessonContent.trim()) {
      setError('Add a course title and starter lesson content.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/learning/studio/courses', {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          metadata: { title: title.trim(), category: category.trim() || null, description: description.trim() || null, durationHours: Number(durationHours) || 1, isRequired },
          publish: false,
          rules: { passingScore: 80, maxAttempts: 3, requiredWatchPercent: 90 },
          sections: [{ title: 'Getting started', lessons: [{ title: lessonTitle.trim(), description: description.trim(), estimatedMinutes: Math.max(5, Math.round((Number(durationHours) || 1) * 60)), blocks: [{ type: 'text', title: lessonTitle.trim(), required: true, content: { text: lessonContent.trim() } }] }] }],
        }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to create course.');
      onCreated();
      onOpenChange(false);
      setTitle(''); setCategory(''); setDescription(''); setDurationHours('1'); setIsRequired(false); setLessonTitle('Introduction'); setLessonContent('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create course.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Create course</DialogTitle><DialogDescription>Create the course and its first curriculum version atomically. You can refine it in Course Studio before publishing.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-2">
          <div><Label htmlFor="course-title">Title</Label><Input id="course-title" className="mt-2" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="course-category">Category</Label><Input id="course-category" className="mt-2" value={category} onChange={e => setCategory(e.target.value)} /></div><div><Label htmlFor="course-duration">Duration (hours)</Label><Input id="course-duration" className="mt-2" type="number" min="0.25" step="0.25" value={durationHours} onChange={e => setDurationHours(e.target.value)} /></div></div>
          <div><Label htmlFor="course-description">Description</Label><Textarea id="course-description" className="mt-2" value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div className="flex items-center justify-between rounded-xl border p-3"><div><p className="text-sm font-semibold">Required learning</p><p className="text-xs text-muted-foreground">Mark this course as a required catalog item.</p></div><Switch checked={isRequired} onCheckedChange={setIsRequired} /></div>
          <div className="rounded-xl border p-4"><p className="text-sm font-semibold">Starter lesson</p><div className="mt-3 grid gap-3"><Input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="Lesson title" /><Textarea className="min-h-32" value={lessonContent} onChange={e => setLessonContent(e.target.value)} placeholder="Write useful starter content. Course Studio can add video, quizzes, assignments, and more." /></div></div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button><Button onClick={create} disabled={saving}>{saving ? 'Creating…' : 'Create draft'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
