"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { CheckCircle2, KeyRound, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SetupDetails = {
  name: string;
  loginEmail: string;
};

export default function SetupPasswordClient() {
  const searchParams = useSearchParams();
  const [token] = React.useState(() => searchParams.get('token') || '');
  const [details, setDetails] = React.useState<SetupDetails | null>(null);
  const [pageError, setPageError] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    async function validateToken() {
      if (!token) {
        setPageError('This password setup link is missing its security token.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/setup-password?token=${encodeURIComponent(token)}`, {
          cache: 'no-store',
        });
        const payload = await response.json() as {
          message?: string;
          name?: string;
          loginEmail?: string;
        };
        if (!active) return;
        if (!response.ok || !payload.name || !payload.loginEmail) {
          setPageError(payload.message || 'This password setup link is no longer valid.');
          return;
        }
        setDetails({ name: payload.name, loginEmail: payload.loginEmail });
        window.history.replaceState({}, '', '/auth/setup-password');
      } catch {
        if (active) setPageError('Unable to validate this link. Please try again.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void validateToken();
    return () => {
      active = false;
    };
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPageError('');
    if (password !== confirmPassword) {
      setPageError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const payload = await response.json() as { message?: string; errors?: string[] };
      if (!response.ok) {
        const fieldErrors = Array.isArray(payload.errors) ? payload.errors.join(' ') : '';
        setPageError(fieldErrors || payload.message || 'Unable to set your password.');
        return;
      }
      setIsComplete(true);
    } catch {
      setPageError('Unable to set your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-100/70 to-transparent dark:from-blue-950/30" />
      <Card className="relative w-full max-w-md border-slate-200/80 bg-white/95 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl tracking-tight">
              {isComplete ? 'Your account is ready' : 'Set up your password'}
            </CardTitle>
            <CardDescription>
              {isComplete
                ? 'Your employee platform password has been saved securely.'
                : 'Create a secure password for your new employee account.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating your secure link…
            </div>
          ) : isComplete ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  Password setup complete
                </div>
                Sign in with <strong>{details?.loginEmail}</strong>.
              </div>
              <Button asChild className="w-full">
                <Link href="/auth/signin">Continue to sign in</Link>
              </Button>
            </div>
          ) : pageError && !details ? (
            <div className="space-y-5">
              <Alert variant="destructive">
                <AlertDescription>{pageError}</AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Ask HR to resend the employee account invitation from your applicant record.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signin">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={submit}>
              <div className="rounded-xl border bg-slate-50 p-3.5 dark:bg-slate-950/60">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Employee login</p>
                <p className="mt-1 font-semibold text-foreground">{details?.loginEmail}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Welcome, {details?.name}.</p>
              </div>

              {pageError && (
                <Alert variant="destructive">
                  <AlertDescription>{pageError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="pl-9"
                    required
                    minLength={8}
                    maxLength={128}
                  />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Use 8–128 characters with uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Save password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
