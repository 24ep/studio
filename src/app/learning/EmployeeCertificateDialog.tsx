"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HrEmployeeSearchSelect } from '@/components/hr/HrEmployeeSearchSelect';

export function EmployeeCertificateDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [employeeId, setEmployeeId] = React.useState('');
  const [name, setName] = React.useState('');
  const [issuer, setIssuer] = React.useState('');
  const [issuedAt, setIssuedAt] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');
  const [verificationUrl, setVerificationUrl] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const save = async () => {
    if (!employeeId || !name.trim()) { setError('Select an employee and enter the certificate name.'); return; }
    setSaving(true); setError(null);
    try {
      const response = await fetch('/api/hr/learning?view=certifications', {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recordType: 'employee', employeeId, name: name.trim(), issuer: issuer.trim() || null, issuedAt: issuedAt || null, expiresAt: expiresAt || null, verificationUrl: verificationUrl.trim() || null, status: 'active', verificationStatus: 'pending' }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to add certificate.');
      onSaved(); onOpenChange(false); setEmployeeId(''); setName(''); setIssuer(''); setIssuedAt(''); setExpiresAt(''); setVerificationUrl('');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to add certificate.'); }
    finally { setSaving(false); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Add employee certificate</DialogTitle><DialogDescription>Register a credential for HR verification. Trusted issuer policy remains in Trusted Certificates.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div><Label>Employee</Label><div className="mt-2"><HrEmployeeSearchSelect value={employeeId} onValueChange={setEmployeeId} disabled={saving} /></div></div><div><Label htmlFor="certificate-name">Certificate</Label><Input id="certificate-name" className="mt-2" value={name} onChange={e => setName(e.target.value)} /></div><div><Label htmlFor="certificate-issuer">Issuer</Label><Input id="certificate-issuer" className="mt-2" value={issuer} onChange={e => setIssuer(e.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="certificate-issued">Issued</Label><Input id="certificate-issued" className="mt-2" type="date" value={issuedAt} onChange={e => setIssuedAt(e.target.value)} /></div><div><Label htmlFor="certificate-expires">Expires</Label><Input id="certificate-expires" className="mt-2" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></div></div><div><Label htmlFor="certificate-url">Verification URL</Label><Input id="certificate-url" className="mt-2" value={verificationUrl} onChange={e => setVerificationUrl(e.target.value)} /></div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Add certificate'}</Button></DialogFooter></DialogContent></Dialog>;
}
