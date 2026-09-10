"use client";

import { FormEvent, useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PrivacySupportShell, ContentPanel, StatusPill } from './PrivacySupportShell';

type Row = { id: string; requestNumber: string; status: string; dueAt: string; submittedAt: string };
type ApiPayload = { requests?: Row[]; requestNumber?: string; message?: string };
const scopes = [['account', 'Account and sign-in'], ['profile', 'Employee profile'], ['documents', 'Documents'], ['activity', 'Activity history'], ['other', 'Other data']];

async function readPayload(response: Response): Promise<ApiPayload> {
  return response.json().catch(() => ({} as ApiPayload));
}

export function DataDeletionPage() {
  const [requests, setRequests] = useState<Row[]>([]);
  const [notice, setNotice] = useState('');
  async function load() {
    try {
      const response = await fetch('/api/privacy-support/privacy-requests', { cache: 'no-store' });
      const data = await readPayload(response);
      if (!response.ok) {
        setNotice(data.message || 'Unable to load deletion requests.');
        return;
      }
      setRequests(data.requests || []);
    } catch {
      setNotice('Unable to reach the privacy support service.');
    }
  }
  useEffect(() => { void load(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/privacy-support/privacy-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details: form.get('details'), scope: form.getAll('scope'), identityConfirmed: form.get('identityConfirmed') === 'on' }),
      });
      const data = await readPayload(response);
      setNotice(response.ok ? `Privacy request ${data.requestNumber} was submitted for review.` : data.message || 'Unable to submit request.');
      if (response.ok) { event.currentTarget.reset(); void load(); }
    } catch {
      setNotice('Unable to reach the privacy support service.');
    }
  }
  return (
    <PrivacySupportShell eyebrow="Your information" title="Data Deletion Request" description="Start a secure, reviewed request to delete personal data associated with your employee account.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <ContentPanel className="p-6 sm:p-8">
            <ShieldAlert className="h-6 w-6 text-amber-700 dark:text-amber-300" />
            <h2 className="mt-4 text-xl font-semibold">What happens next</h2>
            <ol className="mt-5 grid gap-5 text-sm leading-6 sm:grid-cols-3">
              <li><span className="text-xs font-semibold text-blue-700">01</span><p className="mt-2 font-medium">Identity review</p><p className="mt-1 text-muted-foreground">HR verifies that the request belongs to you.</p></li>
              <li><span className="text-xs font-semibold text-blue-700">02</span><p className="mt-2 font-medium">Data assessment</p><p className="mt-1 text-muted-foreground">Records are assessed against legal and business retention duties.</p></li>
              <li><span className="text-xs font-semibold text-blue-700">03</span><p className="mt-2 font-medium">Resolution</p><p className="mt-1 text-muted-foreground">You receive a tracked outcome. Submission never deletes data automatically.</p></li>
            </ol>
          </ContentPanel>
          <ContentPanel className="p-6">
            <h2 className="text-sm font-semibold">Your deletion requests</h2>
            <div className="mt-4 space-y-3">
              {requests.length === 0 && <p className="text-sm text-muted-foreground">You have not submitted a deletion request.</p>}
              {requests.map(row => <div key={row.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 dark:border-zinc-800"><div><p className="text-sm font-medium">{row.requestNumber}</p><p className="mt-1 text-xs text-muted-foreground">Review due {new Date(row.dueAt).toLocaleDateString()}</p></div><StatusPill tone={row.status === 'completed' ? 'good' : row.status === 'rejected' ? 'bad' : 'warn'}>{row.status.replaceAll('_', ' ')}</StatusPill></div>)}
            </div>
          </ContentPanel>
        </div>
        <ContentPanel className="self-start p-6 lg:sticky lg:top-5">
          <h2 className="text-lg font-semibold">Request deletion</h2>
          <form className="mt-5 space-y-5" onSubmit={submit}>
            <fieldset><legend className="text-sm font-medium">Data to include</legend><div className="mt-3 grid gap-2">{scopes.map(([value, label]) => <label key={value} className="flex items-center gap-3 text-sm"><input type="checkbox" name="scope" value={value} className="h-4 w-4" />{label}</label>)}</div></fieldset>
            <div><Label htmlFor="deletion-details">Details and context</Label><Textarea id="deletion-details" name="details" className="mt-2 min-h-32" minLength={20} maxLength={5000} required /></div>
            <label className="flex items-start gap-3 text-sm leading-5"><input type="checkbox" name="identityConfirmed" className="mt-0.5 h-4 w-4" required /><span>I confirm that I am requesting deletion for my own account and understand that some records may be retained where required.</span></label>
            {notice && <p role="status" className="text-sm text-blue-700 dark:text-blue-300">{notice}</p>}
            <Button className="w-full">Submit for review</Button>
          </form>
        </ContentPanel>
      </div>
    </PrivacySupportShell>
  );
}
