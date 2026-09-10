"use client";

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, FileText, Keyboard, Loader2, Send, Sparkles, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type PublicApplyBranding = {
  appName: string;
  organizationName: string;
  appLogoDataUrl: string | null;
};

type PublicApplyPosition = {
  id: string;
  title: string;
  department: string;
  description: string | null;
  positionLevel: string | null;
  publicApplyPath: string;
};

type PublicApplyData = {
  branding: PublicApplyBranding;
  positions: PublicApplyPosition[];
  enabled?: boolean;
  applicationMode?: 'ai' | 'manual' | 'choice';
  selectedPositionId?: string | null;
  captcha?: {
    question: string;
    token: string;
  } | null;
  message?: string;
  screeningConsentRequired?: boolean;
};

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

function getInitialPositionId() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('positionId') || params.get('position') || '';
}

function getShortDescription(description: string | null) {
  if (!description) return 'Share your resume with the hiring team for this opening.';
  return description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function PublicApplyPage({ slug }: { slug?: string }) {
  const [data, setData] = useState<PublicApplyData | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [entryMethod, setEntryMethod] = useState<'ai' | 'manual'>('ai');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const params = new URLSearchParams();
        if (slug) params.set('slug', slug);
        const initialPositionId = getInitialPositionId();
        if (initialPositionId) params.set('positionId', initialPositionId);
        const queryString = params.toString();
        const response = await fetch(`/api/public/apply${queryString ? `?${queryString}` : ''}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load open roles');
        const nextData = await response.json() as PublicApplyData;
        if (!isMounted) return;

        setData(nextData);
        setEntryMethod(nextData.applicationMode === 'manual' ? 'manual' : 'ai');
        if (nextData.enabled === false) {
          setMessage(nextData.message || 'Public applications are currently closed.');
          setSubmitState('error');
          return;
        }
        const firstPositionId = nextData.positions[0]?.id || '';
        setSelectedPositionId(
          nextData.selectedPositionId
            || (nextData.positions.some(position => position.id === initialPositionId)
              ? initialPositionId
              : firstPositionId)
        );
      } catch (error) {
        if (!isMounted) return;
        setMessage(error instanceof Error ? error.message : 'Unable to load application page');
        setSubmitState('error');
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  async function refreshCaptcha() {
    try {
      const response = await fetch('/api/public/apply', { cache: 'no-store' });
      if (!response.ok) return;
      const nextData = await response.json() as PublicApplyData;
      setData((currentData) => currentData
        ? { ...currentData, captcha: nextData.captcha || null }
        : nextData);
    } catch {
      // The next submit attempt will show validation if captcha refresh failed.
    }
  }

  const selectedPosition = useMemo(() => (
    data?.positions.find(position => position.id === selectedPositionId) || null
  ), [data?.positions, selectedPositionId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState('submitting');
    setMessage('');

    try {
      const formData = new FormData(event.currentTarget);
      formData.set('positionId', selectedPositionId);
      formData.set('source', 'public_apply');
      formData.set('entryMethod', entryMethod);

      const response = await fetch('/api/public/apply', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof result.message === 'string' ? result.message : 'Application submit failed');
      }

      event.currentTarget.reset();
      setResumeName('');
      setSubmitState('success');
      setMessage('Your application has been received.');
      void refreshCaptcha();
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Application submit failed');
      void refreshCaptcha();
    }
  }

  const branding = data?.branding;

  if (!slug) {
    return (
      <main className="min-h-screen bg-[#f7f7f2] text-[#1d241f] dark:bg-[#151916] dark:text-[#eef1eb]">
        <div className="mx-auto w-full max-w-4xl px-5 pb-20 pt-20 sm:px-8 sm:pt-28">
          <header className="mx-auto max-w-2xl text-center">
            {branding?.appLogoDataUrl && (
              <img
                src={branding.appLogoDataUrl}
                alt={branding.organizationName || 'Company logo'}
                className="mx-auto mb-8 h-12 w-auto max-w-44 object-contain"
              />
            )}
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
              {branding?.organizationName || 'Careers'}
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
              Open positions
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#626a64] dark:text-[#aeb7b0] sm:text-lg">
              Find your next opportunity and join us in building work that matters.
            </p>
          </header>

          <section className="mt-16 sm:mt-20" aria-labelledby="open-positions-heading">
            <div className="mb-5 flex items-end justify-between border-b border-[#d8ddd6] pb-4 dark:border-[#353c37]">
              <h2 id="open-positions-heading" className="text-sm font-semibold">
                Current openings
              </h2>
              {data && data.enabled !== false && (
                <span className="text-sm text-[#747c76] dark:text-[#9fa8a1]">
                  {data.positions.length} {data.positions.length === 1 ? 'role' : 'roles'}
                </span>
              )}
            </div>

            {!data ? (
              <div className="space-y-2" aria-label="Loading open positions">
                {[0, 1, 2].map(item => (
                  <div key={item} className="h-24 animate-pulse rounded-sm bg-[#e9ebe5] dark:bg-[#202621]" />
                ))}
              </div>
            ) : data.enabled === false ? (
              <p className="py-14 text-center text-[#626a64] dark:text-[#aeb7b0]">
                {data.message || 'Public applications are currently closed.'}
              </p>
            ) : data.positions.length === 0 ? (
              <p className="py-14 text-center text-[#626a64] dark:text-[#aeb7b0]">
                There are no open positions right now. Please check back soon.
              </p>
            ) : (
              <div className="divide-y divide-[#d8ddd6] border-b border-[#d8ddd6] dark:divide-[#353c37] dark:border-[#353c37]">
                {data.positions.map(position => (
                  <Link
                    key={position.id}
                    href={position.publicApplyPath}
                    className="group flex items-center justify-between gap-6 py-6 outline-none transition-colors hover:text-emerald-800 focus-visible:text-emerald-800 dark:hover:text-emerald-300 dark:focus-visible:text-emerald-300 sm:px-2"
                  >
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold tracking-[-0.01em] sm:text-xl">{position.title}</h3>
                      <p className="mt-1.5 text-sm text-[#747c76] dark:text-[#9fa8a1]">
                        {[position.department, position.positionLevel].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                      View role
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-slate-950 dark:text-slate-50">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-5 py-6 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-10">
        <section className="flex flex-col justify-between gap-10 border-b border-slate-200 pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-8 dark:border-slate-800">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              {branding?.appLogoDataUrl ? (
                <img src={branding.appLogoDataUrl} alt="" className="h-11 w-11 rounded-md object-contain" />
              ) : (
                <div className="grid h-11 w-11 place-items-center rounded-md bg-emerald-900 text-white">
                  <FileText className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">{branding?.organizationName || 'Hiring Team'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{branding?.appName || 'hrive'}</p>
              </div>
            </div>

            <div className="space-y-5">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">
                Careers
              </p>
              <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-normal md:text-6xl">
                Share your resume with the hiring team.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
                Choose the role you are interested in, tell us about your experience, and send your profile to the hiring team.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              PDF and DOCX resumes are accepted.
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              Your submission goes directly into the applicant review queue.
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {data?.applicationMode === 'choice' && (
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">How would you like to apply?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setEntryMethod('ai')} aria-pressed={entryMethod === 'ai'} className={`flex gap-3 rounded-xl border p-4 text-left transition ${entryMethod === 'ai' ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700 dark:bg-emerald-950/30' : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900'}`}>
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                    <span><strong className="block text-sm">Use my CV</strong><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">AI reads your CV and builds your profile.</span></span>
                  </button>
                  <button type="button" onClick={() => setEntryMethod('manual')} aria-pressed={entryMethod === 'manual'} className={`flex gap-3 rounded-xl border p-4 text-left transition ${entryMethod === 'manual' ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700 dark:bg-emerald-950/30' : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900'}`}>
                    <Keyboard className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                    <span><strong className="block text-sm">Enter details myself</strong><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">Fill in the key details and attach your CV.</span></span>
                  </button>
                </div>
              </fieldset>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Full name</span>
                <Input name="name" required placeholder="Jane Candidate" className="h-11 bg-white dark:bg-slate-900" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Email</span>
                <Input name="email" type="email" required placeholder="jane@example.com" className="h-11 bg-white dark:bg-slate-900" />
              </label>
            </div>

            {entryMethod === 'manual' && (
              <div className="grid gap-4 border-y border-slate-200 py-6 dark:border-slate-800 sm:grid-cols-2">
                <label className="space-y-2"><span className="text-sm font-medium">Current job title</span><Input name="currentTitle" required placeholder="e.g. Product Designer" className="h-11 bg-white dark:bg-slate-900" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">Years of experience</span><Input name="yearsExperience" inputMode="decimal" placeholder="e.g. 5" className="h-11 bg-white dark:bg-slate-900" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">Location</span><Input name="location" placeholder="City, country" className="h-11 bg-white dark:bg-slate-900" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">LinkedIn</span><Input name="linkedInUrl" type="url" placeholder="https://linkedin.com/in/..." className="h-11 bg-white dark:bg-slate-900" /></label>
                <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Key skills</span><Input name="skills" required placeholder="Research, Figma, stakeholder management" className="h-11 bg-white dark:bg-slate-900" /><span className="text-xs text-slate-500">Separate skills with commas.</span></label>
              </div>
            )}

            <label className="space-y-2 block">
              <span className="text-sm font-medium">Phone</span>
              <Input name="phone" placeholder="+1 555 0100" className="h-11 bg-white dark:bg-slate-900" />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-medium">Position</span>
              <select
                name="positionId"
                required
                value={selectedPositionId}
                onChange={(event) => setSelectedPositionId(event.target.value)}
                className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-slate-900"
              >
                {data?.positions.length ? data.positions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.title} · {position.department}
                  </option>
                )) : (
                  <option value="">No open positions</option>
                )}
              </select>
            </label>

            {selectedPosition && (
              <div className="border-l-2 border-emerald-800 pl-4 text-sm text-slate-600 dark:border-emerald-300 dark:text-slate-300">
                <p className="font-medium text-slate-950 dark:text-slate-50">{selectedPosition.title}</p>
                <p>{selectedPosition.department}{selectedPosition.positionLevel ? ` · ${selectedPosition.positionLevel}` : ''}</p>
                <p className="mt-2 leading-6">{getShortDescription(selectedPosition.description)}</p>
              </div>
            )}

            <label className="block space-y-2">
                <span className="text-sm font-medium">{entryMethod === 'ai' ? 'CV for AI profile creation' : 'CV attachment'}</span>
              <div className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-4 py-5 text-center transition hover:border-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-300">
                <UploadCloud className="h-7 w-7 text-emerald-800 dark:text-emerald-300" />
                <span className="text-sm font-medium">{resumeName || 'Choose a resume file'}</span>
                <span className="text-xs text-slate-500">PDF or DOCX up to 25MB{entryMethod === 'ai' ? ' · securely processed by AI' : ' · saved with your application'}</span>
                <input
                  name="resume"
                  type="file"
                  required
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  onChange={(event) => setResumeName(event.target.files?.[0]?.name || '')}
                />
              </div>
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-medium">Note</span>
              <Textarea name="note" placeholder="Optional context for the hiring team" className="min-h-24 bg-white dark:bg-slate-900" />
            </label>

            <label className="sr-only" aria-hidden="true">
              Company website
              <Input name="website" tabIndex={-1} autoComplete="off" />
            </label>

            {data?.captcha && (
              <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                <input type="hidden" name="captchaToken" value={data.captcha.token} />
                <label className="space-y-2">
                  <span className="text-sm font-medium">Verification</span>
                  <p className="rounded-md border bg-white px-3 py-2 text-sm dark:bg-slate-900">
                    What is {data.captcha.question}?
                  </p>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium">Answer</span>
                  <Input name="captchaAnswer" required inputMode="numeric" className="h-11 bg-white dark:bg-slate-900" />
                </label>
              </div>
            )}

            {data?.screeningConsentRequired && (
              <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                <input name="screeningConsent" value="true" type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300" />
                <span>I consent to a job-relevant search of permitted public news, regulatory, sanctions, and publicly indexed web sources. Possible matches require human review and do not create an automatic employment decision.</span>
              </label>
            )}

            <Button type="submit" size="lg" disabled={submitState === 'submitting' || !data?.positions.length || data?.enabled === false} className="h-11 w-full">
              {submitState === 'submitting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending application
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit application
                </>
              )}
            </Button>

            {message && (
              <p className={submitState === 'error' ? 'text-sm text-red-600' : 'text-sm text-emerald-700 dark:text-emerald-300'}>
                {message}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
