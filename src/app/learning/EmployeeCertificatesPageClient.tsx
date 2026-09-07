"use client";

import * as React from 'react';
import { CheckBadgeIcon, PlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { EmployeeCertificateDialog } from './EmployeeCertificateDialog';

type CertificateItem = {
  id: string;
  name: string;
  issuer: string | null;
  status: string;
  verificationStatus: string;
  issuedAt: string | null;
  expiresAt: string | null;
  employeeName?: string | null;
};

type SelfResponse = { data?: { certificates?: Array<{ id: string; name: string; issuer: string | null; status: string; issuedAt: string | null; expiresAt: string | null }> }; capabilities?: { canManageLearning?: boolean }; message?: string };
type GenericRecord = Record<string, unknown> & { id?: string };
function records(payload: unknown): GenericRecord[] { const value = payload as { resource?: { records?: GenericRecord[] }; records?: GenericRecord[] }; return value?.resource?.records || value?.records || []; }
function normalize(row: GenericRecord): CertificateItem {
  return { id: String(row.id || ''), name: String(row.name || ''), issuer: row.issuer == null ? null : String(row.issuer), status: String(row.status || 'active'), verificationStatus: String(row.verificationStatus ?? row.verification_status ?? 'pending'), issuedAt: row.issuedAt == null && row.issued_at == null ? null : String(row.issuedAt ?? row.issued_at), expiresAt: row.expiresAt == null && row.expires_at == null ? null : String(row.expiresAt ?? row.expires_at), employeeName: row.employeeName == null ? null : String(row.employeeName) };
}
function date(value: string | null) { if (!value) return '—'; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(); }

export function EmployeeCertificatesPageClient() {
  const [items, setItems] = React.useState<CertificateItem[]>([]);
  const [canManage, setCanManage] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const selfResponse = await fetch('/api/learning/me', { credentials: 'include', cache: 'no-store' });
      const self = await selfResponse.json() as SelfResponse;
      if (!selfResponse.ok) throw new Error(self.message || 'Unable to load certificates.');
      const manage = Boolean(self.capabilities?.canManageLearning); setCanManage(manage);
      if (!manage) {
        setItems((self.data?.certificates || []).map(item => ({ ...item, verificationStatus: 'verified' })));
        return;
      }
      const response = await fetch('/api/hr/learning?view=certifications', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error('Unable to load certificate verification queue.');
      setItems(records(payload).filter(row => String(row.recordType ?? row.record_type ?? 'employee') === 'employee').map(normalize));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load certificates.'); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const decide = async (item: CertificateItem, verificationStatus: 'verified' | 'rejected') => {
    setBusyId(item.id); setError(null);
    try {
      const response = await fetch(`/api/hr/learning?view=certifications&id=${encodeURIComponent(item.id)}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ verificationStatus, verifiedAt: verificationStatus === 'verified' ? new Date().toISOString().slice(0, 10) : null }) });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to update certificate verification.');
      await load();
    } catch (decisionError) { setError(decisionError instanceof Error ? decisionError.message : 'Unable to update certificate verification.'); }
    finally { setBusyId(null); }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b pb-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">Learning · Credentials</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em] sm:text-4xl">Employee certificates</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Your credentials stay personal. HR sees the verification queue only when management capability is granted.</p></div>{canManage && <Button onClick={() => setDialogOpen(true)}><PlusIcon className="mr-2 h-4 w-4" />Add certificate</Button>}</header>
      {error && <p role="alert" className="my-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <div className="mt-6 overflow-hidden rounded-2xl border bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Certificate</th><th className="px-4 py-3">Issuer</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Verification</th>{canManage && <th className="px-4 py-3 text-right">Actions</th>}</tr></thead><tbody>{loading ? <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-10 text-center text-muted-foreground">Loading certificates…</td></tr> : items.length ? items.map(item => <tr key={item.id} className="border-t"><td className="px-4 py-4 font-semibold"><span className="inline-flex items-center gap-2"><CheckBadgeIcon className="h-5 w-5 text-emerald-600" />{item.name}</span></td><td className="px-4 py-4 text-muted-foreground">{item.issuer || '—'}</td><td className="px-4 py-4 text-muted-foreground">{date(item.issuedAt)}</td><td className="px-4 py-4 text-muted-foreground">{date(item.expiresAt)}</td><td className="px-4 py-4"><span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize"><ShieldCheckIcon className="h-4 w-4" />{item.verificationStatus.replaceAll('_', ' ')}</span></td>{canManage && <td className="px-4 py-4 text-right"><div className="inline-flex gap-2"><Button size="sm" variant="outline" disabled={busyId === item.id || item.verificationStatus === 'verified'} onClick={() => decide(item, 'verified')}>Verify</Button><Button size="sm" variant="ghost" disabled={busyId === item.id || item.verificationStatus === 'rejected'} onClick={() => decide(item, 'rejected')}>Reject</Button></div></td>}</tr>) : <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-10 text-center text-muted-foreground">No employee certificates found.</td></tr>}</tbody></table></div></div>
      {canManage && <EmployeeCertificateDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />}
    </main>
  );
}
