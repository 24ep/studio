"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, FileSignature, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PublicOffer {
  id: string;
  recipientName: string;
  recipientEmail: string;
  jobTitle: string;
  status: string;
  letterHtml: string;
  acceptedAt: string | null;
  signedName: string | null;
  signedAt: string | null;
  signatureHash: string | null;
  isActionable: boolean;
  applicantStage: string | null;
}

export function OfferLetterPageClient({ token }: { token: string }) {
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  const [signedName, setSignedName] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function loadOffer() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/job-offers/${token}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to load offer letter');
      setOffer(data.offer);
      setSignedName(data.offer.signedName || data.offer.recipientName || '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load offer letter');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOffer();
  }, [token]);

  async function acceptOffer() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/job-offers/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedName, consent }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Failed to accept offer');
      await loadOffer();
      setConfirmOpen(false);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Failed to accept offer');
    } finally {
      setSubmitting(false);
    }
  }

  const canSign = Boolean(signedName.trim()) && consent && offer?.isActionable;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Offer Letter</h1>
            <p className="text-sm text-slate-600">Secure electronic acceptance page</p>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Token verified
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-slate-600">Loading offer...</div>
        ) : error && !offer ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{error}</div>
        ) : offer ? (
          <>
            <section className="rounded-lg border bg-white p-6 shadow-sm">
              <div
                className="prose max-w-none prose-slate"
                dangerouslySetInnerHTML={{ __html: offer.letterHtml }}
              />
            </section>

            {offer.status === 'accepted' ? (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-emerald-950">Offer accepted electronically</div>
                    <div className="text-emerald-900">Signed by {offer.signedName} on {offer.signedAt ? new Date(offer.signedAt).toLocaleString() : 'recorded date'}.</div>
                    {offer.signatureHash && (
                      <div className="break-all font-mono text-xs text-emerald-800">Signature hash: {offer.signatureHash}</div>
                    )}
                  </div>
                </div>
              </section>
            ) : !offer.isActionable ? (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
                This offer is no longer awaiting acceptance because the applicant has already been hired.
              </section>
            ) : (
              <section className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold tracking-normal">Electronic Signature</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signed-name">Legal name</Label>
                    <Input
                      id="signed-name"
                      value={signedName}
                      onChange={(event) => setSignedName(event.target.value)}
                      placeholder="Type your full legal name"
                    />
                  </div>
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} />
                    <span>I agree to use an electronic signature and accept this offer letter. I understand this action records my name, timestamp, IP address, browser information, and a tamper-evident signature hash.</span>
                  </label>
                  {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                  <Button disabled={!canSign || submitting} onClick={() => setConfirmOpen(true)}>
                    Sign and Accept Offer
                  </Button>
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm electronic signature</AlertDialogTitle>
            <AlertDialogDescription>
              By continuing, you accept this offer letter as {signedName || 'the signer'} and create a permanent signature record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={(event) => {
              event.preventDefault();
              void acceptOffer();
            }}>
              Confirm and Sign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
