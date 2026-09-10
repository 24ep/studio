"use client";

import type { FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AiProvider } from '@/components/settings/ai-api-keys-utils';

type TourStep = {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Workflow;
  points: string[];
};

const tourSteps: TourStep[] = [
  {
    eyebrow: 'Your first activation step',
    title: 'Shape the hiring workflow',
    description: 'After account creation, start with the company profile and the hiring defaults your team will use every day.',
    icon: Workflow,
    points: ['Confirm the company profile', 'Review recruitment stages and sources', 'Set position levels and grades'],
  },
  {
    eyebrow: 'Your second activation step',
    title: 'Prepare people operations',
    description: 'Build the minimum workforce structure before inviting the wider team into the workspace.',
    icon: UsersRound,
    points: ['Create departments and employee records', 'Configure attendance and leave', 'Review roles before inviting teammates'],
  },
  {
    eyebrow: 'Your final activation step',
    title: 'Open the first hiring flow',
    description: 'The dashboard will keep one activation checklist visible until the required workspace tasks are complete.',
    icon: Sparkles,
    points: ['Create or review an open position', 'Invite the people who will manage hiring', 'Return to the checklist whenever you need'],
  },
];

const aiProviders: Array<{ value: AiProvider; label: string }> = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'deepseek', label: 'DeepSeek' },
];

export const TOUR_STEP_COUNT = tourSteps.length;

export function AiConnectionStep({
  provider,
  apiKey,
  model,
  showApiKey,
  isSaving,
  connectionStatus,
  message,
  isAuthenticated,
  onSubmit,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onToggleApiKey,
  onContinue,
}: {
  provider: AiProvider;
  apiKey: string;
  model: string;
  showApiKey: boolean;
  isSaving: boolean;
  connectionStatus: 'idle' | 'saved' | 'verified';
  message: string;
  isAuthenticated: boolean;
  onSubmit: (event: FormEvent) => void;
  onProviderChange: (provider: AiProvider) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (apiKey: string) => void;
  onToggleApiKey: () => void;
  onContinue: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">Step 3 · Optional</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Connect your AI provider</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Add one key to activate matching, evaluation, and writing assistance. The key is encrypted by the existing platform key manager.
          </p>
        </div>
      </div>

      {message && (
        <Alert variant={connectionStatus === 'idle' ? 'destructive' : 'default'}>
          <AlertDescription className="flex items-start gap-2">
            {connectionStatus !== 'idle' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            {message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="setup-ai-provider">AI provider</Label>
          <Select value={provider} onValueChange={(value) => onProviderChange(value as AiProvider)} disabled={isSaving}>
            <SelectTrigger id="setup-ai-provider"><SelectValue /></SelectTrigger>
            <SelectContent>
              {aiProviders.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="setup-ai-model">Default model</Label>
          <Input id="setup-ai-model" value={model} onChange={(event) => onModelChange(event.target.value)} disabled={isSaving} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="setup-ai-key">API key</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="setup-ai-key"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="px-9"
            placeholder={provider === 'openai' ? 'sk-…' : 'Paste provider API key'}
            disabled={isSaving || connectionStatus === 'verified'}
            required={connectionStatus === 'idle'}
          />
          <button
            type="button"
            onClick={onToggleApiKey}
            className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs leading-5 text-slate-500">
          The browser sends this key only to the authenticated settings API. It is never returned in full.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onContinue}>
          {connectionStatus === 'idle' ? 'Skip for now' : 'Continue to tour'}
        </Button>
        {connectionStatus === 'verified' ? (
          <Button type="button" onClick={onContinue}>
            Continue to tour
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSaving || !isAuthenticated} className="sm:min-w-44">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Save and verify
          </Button>
        )}
      </div>
    </form>
  );
}

export function ActivationTourStep({
  index,
  onBack,
  onNext,
  onSkip,
}: {
  index: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const step = tourSteps[index];
  const TourIcon = step.icon;
  return (
    <div className="space-y-7">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <TourIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">{step.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
        </div>
      </div>

      <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {step.points.map((point) => (
          <div key={point} className="flex items-center gap-3 py-3.5 text-sm">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Check className="h-3 w-3" />
            </span>
            <span className="font-medium">{point}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5" aria-label={`Tour step ${index + 1} of ${TOUR_STEP_COUNT}`}>
          {tourSteps.map((tourStep, stepIndex) => (
            <span key={tourStep.title} className={`h-1.5 rounded-full transition-all ${stepIndex === index ? 'w-7 bg-blue-700 dark:bg-blue-300' : 'w-2 bg-slate-300 dark:bg-slate-700'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <Button type="button" onClick={onNext}>
            {index === TOUR_STEP_COUNT - 1 ? 'Complete tour' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <button type="button" onClick={onSkip} className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline dark:hover:text-slate-200">
        Skip the tour
      </button>
    </div>
  );
}

export function SetupCompleteStep({
  email,
  isAuthenticated,
  onFinish,
}: {
  email: string;
  isAuthenticated: boolean;
  onFinish: () => void;
}) {
  return (
    <div className="space-y-7">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Ready to continue</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Your administrator account is ready.</h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
          Next, initialize the recommended workspace foundation. After that, one activation checklist will guide the remaining organization tasks.
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Administrator login</p>
          <p className="mt-1 text-sm font-semibold">{email}</p>
        </div>
        <Button type="button" onClick={onFinish} className="sm:min-w-44">
          {isAuthenticated ? 'Continue setup' : 'Continue to sign in'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
