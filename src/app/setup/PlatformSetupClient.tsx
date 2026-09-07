"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { fetchAiAvailableModels, saveAiApiKeys } from '@/components/settings/ai-api-keys-api';
import {
  getProviderDefaultModel,
  type AiProvider,
} from '@/components/settings/ai-api-keys-utils';
import { getJsonErrorMessage, readJsonObject } from '@/lib/response-json';
import { EnvironmentSetupStep, type InstallationEnvironment } from './EnvironmentSetupStep';
import {
  ActivationTourStep,
  AiConnectionStep,
  SetupCompleteStep,
  TOUR_STEP_COUNT,
} from './PlatformSetupGuidedSteps';
import { SetupAside } from './SetupAside';

type SetupStage = 'account' | 'environment' | 'ai' | 'tour' | 'complete';
type EnvironmentJob = { id: string; status: string; progress: number; error?: string | null; result?: { stage?: string } | null };

export default function PlatformSetupClient({ initialAdminCreated = false }: { initialAdminCreated?: boolean }) {
  const router = useRouter();
  const [stage, setStage] = React.useState<SetupStage>(initialAdminCreated ? 'environment' : 'account');
  const [tourIndex, setTourIndex] = React.useState(0);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [aiProvider, setAiProvider] = React.useState<AiProvider>('openai');
  const [aiApiKey, setAiApiKey] = React.useState('');
  const [aiModel, setAiModel] = React.useState(getProviderDefaultModel('openai'));
  const [showAiApiKey, setShowAiApiKey] = React.useState(false);
  const [isSavingAi, setIsSavingAi] = React.useState(false);
  const [aiConnectionStatus, setAiConnectionStatus] = React.useState<'idle' | 'saved' | 'verified'>('idle');
  const [aiMessage, setAiMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(initialAdminCreated);
  const [installationEnvironment, setInstallationEnvironment] = React.useState<InstallationEnvironment>('demo');
  const [employeeCount, setEmployeeCount] = React.useState('1000');
  const [historyMonths, setHistoryMonths] = React.useState('24');
  const [isInitializingEnvironment, setIsInitializingEnvironment] = React.useState(false);
  const [environmentJobId, setEnvironmentJobId] = React.useState<string | null>(null);
  const [environmentProgress, setEnvironmentProgress] = React.useState(0);
  const [environmentStage, setEnvironmentStage] = React.useState('Waiting to start');
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (!initialAdminCreated) return;
    void fetch('/api/settings/installation-environment')
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { job?: EnvironmentJob | null } | null) => {
        if (payload?.job && ['pending', 'processing'].includes(payload.job.status)) {
          setEnvironmentJobId(payload.job.id);
          setIsInitializingEnvironment(true);
          setEnvironmentProgress(payload.job.progress || 0);
          setEnvironmentStage(payload.job.result?.stage || 'Resuming demo initialization');
        }
      })
      .catch(() => undefined);
  }, [initialAdminCreated]);

  React.useEffect(() => {
    if (!environmentJobId || !isInitializingEnvironment) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/settings/installation-environment?jobId=${encodeURIComponent(environmentJobId)}`, { cache: 'no-store' });
        const payload = await readJsonObject(response) as { job?: EnvironmentJob | null };
        if (!response.ok || !payload.job) throw new Error(getJsonErrorMessage(payload, 'Unable to read initialization progress.'));
        if (cancelled) return;
        setEnvironmentProgress(payload.job.progress || 0);
        setEnvironmentStage(payload.job.result?.stage || (payload.job.status === 'pending' ? 'Queued' : 'Preparing workspace'));
        if (payload.job.status === 'completed') {
          setIsInitializingEnvironment(false);
          setStage('ai');
          return;
        }
        if (payload.job.status === 'failed') {
          setIsInitializingEnvironment(false);
          setErrorMessage(payload.job.error || 'Demo initialization failed. You can retry safely.');
          return;
        }
        window.setTimeout(poll, 1200);
      } catch {
        if (!cancelled) window.setTimeout(poll, 2500);
      }
    };
    void poll();
    return () => { cancelled = true; };
  }, [environmentJobId, isInitializingEnvironment]);

  const submitAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/public/platform-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const payload = await readJsonObject(response);
      if (!response.ok) throw new Error(getJsonErrorMessage(payload, 'Unable to create the administrator account.'));

      const normalizedEmail = email.trim().toLowerCase();
      const authentication = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      });
      setIsAuthenticated(authentication?.ok === true);
      setEmail(normalizedEmail);
      setPassword('');
      setConfirmPassword('');
      setStage('environment');
    } catch (error) {
      console.error('First administrator setup failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to complete platform setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveInstallationEnvironment = async () => {
    setErrorMessage('');
    if (!isAuthenticated) {
      setErrorMessage('Your administrator session is not active. Sign in before initializing this installation.');
      return;
    }
    setIsInitializingEnvironment(true);
    try {
      const body = installationEnvironment === 'demo'
        ? { environment: 'demo', employeeCount: Number(employeeCount), historyMonths: Number(historyMonths) }
        : { environment: 'production' };
      const response = await fetch('/api/settings/installation-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await readJsonObject(response);
      if (!response.ok) throw new Error(getJsonErrorMessage(payload, 'Unable to initialize the installation environment.'));
      if (installationEnvironment === 'production') {
        setStage('ai');
      } else {
        const jobId = typeof payload.jobId === 'string' ? payload.jobId : null;
        if (!jobId) throw new Error('The demo initialization job was not created.');
        setEnvironmentJobId(jobId);
        setEnvironmentProgress(typeof payload.progress === 'number' ? payload.progress : 0);
        setEnvironmentStage('Queued');
        return;
      }
    } catch (error) {
      console.error('Installation environment setup failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to initialize the installation environment.');
      setIsInitializingEnvironment(false);
    } finally {
      if (installationEnvironment === 'production') setIsInitializingEnvironment(false);
    }
  };

  const updateAiProvider = (provider: AiProvider) => {
    setAiProvider(provider);
    setAiModel(getProviderDefaultModel(provider));
    setAiConnectionStatus('idle');
    setAiMessage('');
  };

  const updateAiApiKey = (value: string) => {
    setAiApiKey(value);
    setAiConnectionStatus('idle');
    setAiMessage('');
  };

  const saveAiConnection = async (event: React.FormEvent) => {
    event.preventDefault();
    setAiMessage('');
    if (!isAuthenticated) {
      setAiMessage('Your administrator session is not active yet. Continue to sign in, then add the key from HR Setup.');
      return;
    }
    if (!aiApiKey.trim()) {
      setAiMessage('Enter an API key or skip this step.');
      return;
    }

    setIsSavingAi(true);
    try {
      const providerResponse = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ key: 'aiProviderSelection', value: aiProvider }]),
      });
      const providerPayload = await readJsonObject(providerResponse);
      if (!providerResponse.ok) throw new Error(getJsonErrorMessage(providerPayload, 'Unable to select the AI provider.'));

      await saveAiApiKeys({
        provider: aiProvider,
        apiKeys: [{ key: aiApiKey.trim(), priority: 1, selectedModel: aiModel.trim() || getProviderDefaultModel(aiProvider) }],
        fallbackMessage: 'Unable to save the AI API key.',
      });
      setAiApiKey('');
      setAiConnectionStatus('saved');

      const verification = await fetchAiAvailableModels(aiProvider);
      if (verification.models.length > 0) {
        setAiConnectionStatus('verified');
        setAiMessage(`Connection verified. ${verification.models.length} model${verification.models.length === 1 ? '' : 's'} available.`);
      } else {
        setAiMessage(verification.error || 'The key was saved securely, but the connection could not be verified yet.');
      }
    } catch (error) {
      console.error('AI setup failed:', error);
      setAiMessage(error instanceof Error ? error.message : 'Unable to configure the AI connection.');
      setAiConnectionStatus('idle');
    } finally {
      setIsSavingAi(false);
    }
  };

  const finishSetup = () => {
    router.replace(isAuthenticated ? '/' : '/auth/signin');
    router.refresh();
  };

  const advanceTour = () => {
    if (tourIndex < TOUR_STEP_COUNT - 1) {
      setTourIndex((current) => current + 1);
      return;
    }
    setStage('complete');
  };

  const progress = stage === 'account'
    ? 12
    : stage === 'environment'
      ? 28
      : stage === 'ai'
        ? 44
        : stage === 'complete'
          ? 100
          : 58 + Math.round(((tourIndex + 1) / TOUR_STEP_COUNT) * 30);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[minmax(320px,0.8fr)_minmax(560px,1.2fr)]">
        <SetupAside />

        <section className="flex min-h-[640px] items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-xl">
            <div className="mb-8 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {stage === 'account' ? 'Administrator account' : stage === 'environment' ? 'Installation environment' : stage === 'ai' ? 'AI connection' : stage === 'tour' ? 'Activation preview' : 'Account ready'}
                </span>
                <span className="text-muted-foreground">{stage === 'environment' && isInitializingEnvironment ? `${environmentProgress}% complete` : 'A few guided steps'}</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-slate-200 dark:bg-slate-800" />
            </div>

            {stage === 'account' && (
              <form onSubmit={submitAdmin} className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">Step 1</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Create the first administrator</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    This account owns platform configuration, permissions, and the initial team setup.
                  </p>
                </div>

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="setup-name">Full name</Label>
                    <Input
                      id="setup-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      placeholder="Nara Admin"
                      minLength={2}
                      maxLength={120}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setup-email">Work email</Label>
                    <Input
                      id="setup-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      placeholder="admin@company.com"
                      maxLength={254}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setup-password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="setup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      className="px-9"
                      minLength={8}
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">Use uppercase, lowercase, a number, and a special character.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setup-confirm-password">Confirm password</Label>
                  <Input
                    id="setup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                  <p className="max-w-xs text-xs leading-5 text-slate-500">You will choose Demo or Production before setup closes.</p>
                  <Button type="submit" disabled={isSubmitting} className="sm:min-w-44">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Create administrator
                  </Button>
                </div>
              </form>
            )}

            {stage === 'environment' && (
              <EnvironmentSetupStep
                employeeCount={employeeCount}
                environment={installationEnvironment}
                errorMessage={errorMessage}
                historyMonths={historyMonths}
                isAuthenticated={isAuthenticated}
                isInitializing={isInitializingEnvironment}
                progress={environmentProgress}
                progressStage={environmentStage}
                onEmployeeCountChange={setEmployeeCount}
                onEnvironmentChange={setInstallationEnvironment}
                onHistoryMonthsChange={setHistoryMonths}
                onSubmit={saveInstallationEnvironment}
              />
            )}

            {stage === 'ai' && (
              <AiConnectionStep
                provider={aiProvider}
                apiKey={aiApiKey}
                model={aiModel}
                showApiKey={showAiApiKey}
                isSaving={isSavingAi}
                connectionStatus={aiConnectionStatus}
                message={aiMessage}
                isAuthenticated={isAuthenticated}
                onSubmit={saveAiConnection}
                onProviderChange={updateAiProvider}
                onModelChange={setAiModel}
                onApiKeyChange={updateAiApiKey}
                onToggleApiKey={() => setShowAiApiKey((current) => !current)}
                onContinue={() => setStage('tour')}
              />
            )}

            {stage === 'tour' && (
              <ActivationTourStep
                index={tourIndex}
                onBack={() => setTourIndex((current) => current - 1)}
                onNext={advanceTour}
                onSkip={() => setStage('complete')}
              />
            )}

            {stage === 'complete' && (
              <SetupCompleteStep email={email} isAuthenticated={isAuthenticated} onFinish={finishSetup} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
