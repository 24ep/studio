"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HrEmployeeSearchSelect } from '@/components/hr/HrEmployeeSearchSelect';

export function LearningAssignmentDialog({
  open,
  onOpenChange,
  courseIds,
  sourceType,
  sourceId,
  sourceLabel,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseIds: string[];
  sourceType: 'course' | 'path' | 'manual';
  sourceId?: string | null;
  sourceLabel: string;
  onAssigned?: () => void;
}) {
  const [employeeId, setEmployeeId] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const idempotencyKey = React.useRef(crypto.randomUUID());

  React.useEffect(() => {
    if (open) idempotencyKey.current = crypto.randomUUID();
  }, [open, courseIds, sourceId]);

  const assign = async () => {
    if (!employeeId || !courseIds.length) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch('/api/learning/assignments', {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ employeeId, courseIds, sourceType, sourceId: sourceId || null, sourceLabel, dueDate: dueDate || null, idempotencyKey: idempotencyKey.current }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to assign learning.');
      onAssigned?.();
      onOpenChange(false);
      setEmployeeId(''); setDueDate(''); idempotencyKey.current = crypto.randomUUID();
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Unable to assign learning.');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Assign learning</DialogTitle><DialogDescription>Assign {courseIds.length === 1 ? sourceLabel : `${courseIds.length} courses from ${sourceLabel}`} as one atomic learning action.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-2">
          <div><Label>Employee</Label><div className="mt-2"><HrEmployeeSearchSelect value={employeeId} onValueChange={setEmployeeId} disabled={saving} /></div></div>
          <div><Label htmlFor="learning-due-date">Due date</Label><Input id="learning-due-date" className="mt-2" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button><Button onClick={assign} disabled={saving || !employeeId || !courseIds.length}>{saving ? 'Assigning…' : 'Assign'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
