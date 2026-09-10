"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, Loader2, Rocket } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  areRequiredPlatformFeaturesReady,
  getPlatformSetupProgress,
  getRecommendedPlatformInitializationIds,
  platformSetupFeatures,
  type PlatformSetupFeatureId,
  type PlatformSetupFeatureStatus,
} from '@/lib/admin-platform-setup';
import type { AppKitSetupPreviewGroup } from '@/lib/appkit-setup-preview';
import { getJsonErrorMessage, readJsonObject } from '@/lib/response-json';

import { AdminPlatformSetupPreviewDialog } from './AdminPlatformSetupPreviewDialog';
import {
  featureGroups,
  featureIcons,
  isFeatureStatus,
} from './admin-platform-setup-config';

interface AdminPlatformSetupOnboardingProps {
  isAdmin: boolean;
  userId: string;
}

export function AdminPlatformSetupOnboarding({
  isAdmin,
  userId,
}: AdminPlatformSetupOnboardingProps) {
  const [open, setOpen] = React.useState(false);
  const [statuses, setStatuses] = React.useState<PlatformSetupFeatureStatus[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeFeature, setActiveFeature] = React.useState<PlatformSetupFeatureId | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = React.useState<PlatformSetupFeatureId>('company-reference');
  const [isInitializingAll, setIsInitializingAll] = React.useState(false);
  const [failedFeatures, setFailedFeatures] = React.useState<Partial<Record<PlatformSetupFeatureId, string>>>({});
  const [setupMessage, setSetupMessage] = React.useState('');
  const [previewFeatureIds, setPreviewFeatureIds] = React.useState<PlatformSetupFeatureId[]>([]);
  const [previewGroups, setPreviewGroups] = React.useState<AppKitSetupPreviewGroup[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);
  const pathname = usePathname();
  const storageKey = React.useMemo(() => `hri:admin-platform-setup:v5:${userId}`, [userId]);

  const loadStatus = React.useCallback(async (allowAutoOpen: boolean) => {
    if (!isAdmin) return [];

    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/platform-setup/status', { cache: 'no-store' });
      const payload = await readJsonObject(response);
      if (!response.ok) {
        throw new Error(getJsonErrorMessage(payload, 'Failed to load platform setup'));
      }

      const nextStatuses: PlatformSetupFeatureStatus[] = [];
      if (Array.isArray(payload.features)) {
        for (const featureStatus of payload.features) {
          if (isFeatureStatus(featureStatus)) nextStatuses.push(featureStatus);
        }
      }
      if (nextStatuses.length !== platformSetupFeatures.length) {
        throw new Error('Platform setup status is incomplete');
      }

      setStatuses(nextStatuses);
      setSelectedFeatureId((current) => {
        const currentStatus = nextStatuses.find((status) => status.id === current);
        if (currentStatus && !currentStatus.ready) return current;

        return platformSetupFeatures.find((feature) => (
          !feature.optional
          && nextStatuses.some((status) => status.id === feature.id && !status.ready)
        ))?.id || current;
      });
      const allReady = areRequiredPlatformFeaturesReady(nextStatuses);
      if (allReady) {
        window.localStorage.setItem(storageKey, 'completed');
      } else if (allowAutoOpen && window.localStorage.getItem(storageKey) !== 'dismissed') {
        setOpen(true);
      }
      return nextStatuses;
    } catch (error) {
      console.error('Failed to load platform setup onboarding:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, storageKey]);

  React.useEffect(() => {
    if (!isAdmin) return;
    const isDashboardEntry = pathname === '/' || pathname === '/dashboard';
    void loadStatus(isDashboardEntry);
  }, [isAdmin, loadStatus, pathname]);

  const initializeRequest = React.useCallback(async (featureId: PlatformSetupFeatureId) => {
    const feature = platformSetupFeatures.find((item) => item.id === featureId);
    if (!feature) throw new Error('Unknown platform feature');
    if (!feature.endpoint) throw new Error(`${feature.title} requires manual configuration`);

    const response = await fetch(feature.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment: 'production' }),
    });
    const payload = await readJsonObject(response);
    if (!response.ok) {
      throw new Error(getJsonErrorMessage(payload, `Failed to initialize ${feature.title}`));
    }
  }, []);

  const initializeFeature = async (featureId: PlatformSetupFeatureId) => {
    const feature = platformSetupFeatures.find((item) => item.id === featureId);
    setActiveFeature(featureId);
    setSetupMessage('');
    setFailedFeatures((current) => {
      const next = { ...current };
      delete next[featureId];
      return next;
    });
    try {
      await initializeRequest(featureId);
      setStatuses((current) => current.map((status) => (
        status.id === featureId ? { ...status, ready: true } : status
      )));
      await loadStatus(false);
      toast.success(`${feature?.title || 'Feature'} is ready`);
    } catch (error) {
      console.error(`Failed to initialize ${featureId}:`, error);
      const message = error instanceof Error ? error.message : 'Feature initialization failed';
      setFailedFeatures((current) => ({ ...current, [featureId]: message }));
      setSetupMessage(`${feature?.title || 'This item'} still needs attention. Review the message below and retry.`);
      toast.error(message);
    } finally {
      setActiveFeature(null);
    }
  };

  const initializeRemaining = async () => {
    const pendingIds = getRecommendedPlatformInitializationIds(statuses);
    if (pendingIds.length === 0) {
      const manualFeature = platformSetupFeatures.find(feature =>
        !feature.optional && feature.href && statuses.some(status => status.id === feature.id && !status.ready),
      );
      if (manualFeature?.href) {
        setOpen(false);
        window.location.assign(manualFeature.href);
      }
      return;
    }

    setIsInitializingAll(true);
    setSetupMessage(`Initializing ${pendingIds.length} recommended default${pendingIds.length === 1 ? '' : 's'}...`);
    setFailedFeatures({});
    const results = await Promise.allSettled(pendingIds.map(async (featureId) => {
      await initializeRequest(featureId);
      return featureId;
    }));
    const failures: Partial<Record<PlatformSetupFeatureId, string>> = {};
    const successfulIds: PlatformSetupFeatureId[] = [];
    results.forEach((result, index) => {
      const featureId = pendingIds[index];
      if (result.status === 'fulfilled') {
        successfulIds.push(featureId);
      } else {
        console.error(`Failed to initialize ${featureId}:`, result.reason);
        failures[featureId] = result.reason instanceof Error ? result.reason.message : 'Initialization failed. Retry this item.';
      }
    });
    setStatuses((current) => current.map((status) => (
      successfulIds.includes(status.id) ? { ...status, ready: true } : status
    )));
    setFailedFeatures(failures);
    setActiveFeature(null);
    setIsInitializingAll(false);
    await loadStatus(false);

    const failureCount = Object.keys(failures).length;
    if (failureCount === 0) {
      setSetupMessage('Recommended defaults are ready. Continue with the remaining configuration items.');
      toast.success('Recommended defaults are ready');
    } else {
      setSetupMessage(`${successfulIds.length} item${successfulIds.length === 1 ? '' : 's'} initialized. ${failureCount} still need attention.`);
      toast.error(`${failureCount} setup item${failureCount === 1 ? '' : 's'} could not be initialized`);
    }
  };

  const previewInitialization = async (featureIds: PlatformSetupFeatureId[]) => {
    if (featureIds.length === 0) return;
    setPreviewFeatureIds(featureIds);
    setPreviewGroups([]);
    setIsPreviewOpen(true);
    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/settings/platform-setup/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: 'production', featureIds }),
      });
      const payload = await readJsonObject(response);
      if (!response.ok) throw new Error(getJsonErrorMessage(payload, 'Unable to preview AppKit data'));
      setPreviewGroups(Array.isArray(payload.groups) ? payload.groups as unknown as AppKitSetupPreviewGroup[] : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to preview AppKit data';
      toast.error(message);
      setIsPreviewOpen(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const confirmPreviewInitialization = async () => {
    const featureIds = previewFeatureIds;
    setIsPreviewOpen(false);
    if (featureIds.length === 1) {
      await initializeFeature(featureIds[0]);
      return;
    }
    await initializeRemaining();
  };

  const reviewRecommendedInitialization = () => {
    const pendingIds = getRecommendedPlatformInitializationIds(statuses);
    if (pendingIds.length === 0) {
      void initializeRemaining();
      return;
    }
    void previewInitialization(pendingIds);
  };

  const progress = getPlatformSetupProgress(statuses);
  const allReady = statuses.length === platformSetupFeatures.length
    && areRequiredPlatformFeaturesReady(statuses);
  const isBusy = isInitializingAll || activeFeature !== null;
  const selectedFeature = platformSetupFeatures.find((feature) => feature.id === selectedFeatureId)
    || platformSetupFeatures[0];
  const selectedStatus = statuses.find((status) => status.id === selectedFeature.id);
  const selectedReady = selectedStatus?.ready === true;
  const SelectedFeatureIcon = featureIcons[selectedFeature.id];

  const dismiss = (value: 'dismissed' | 'completed') => {
    window.localStorage.setItem(storageKey, value);
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !allReady) {
      window.localStorage.setItem(storageKey, 'dismissed');
    }
    setOpen(nextOpen);
  };

  if (!isAdmin) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent dialogId="admin-platform-setup" className="max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-4xl sm:overflow-hidden">
          <DialogHeader className="space-y-4 px-6 pb-5 pt-6 pr-14 sm:px-8 sm:pr-14">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  <Rocket className="h-3.5 w-3.5" />
                  Phase 2 · Workspace setup
                </div>
                <DialogTitle className="text-2xl tracking-tight">Prepare your workspace</DialogTitle>
                <DialogDescription className="max-w-lg leading-6">
                  Complete the essentials before inviting your team. Start with recommended defaults, then add your organization details.
                </DialogDescription>
              </div>

              <div className="w-full space-y-2 sm:w-56" aria-live="polite">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Platform readiness</span>
                  <span className="tabular-nums text-muted-foreground">{progress.completed} of {progress.total}</span>
                </div>
                <Progress
                  value={progress.percentage}
                  className="h-2"
                  aria-label="Workspace foundation readiness"
                  aria-valuetext={`${progress.completed} of ${progress.total} required defaults ready`}
                />
              </div>
            </div>

            {setupMessage ? (
              <Alert variant={Object.keys(failedFeatures).length > 0 ? 'destructive' : 'default'}>
                <AlertDescription>{setupMessage}</AlertDescription>
              </Alert>
            ) : null}
          </DialogHeader>

          <div className="grid min-h-0 border-y md:grid-cols-[16rem_minmax(0,1fr)]">
            <nav
              className="max-h-[30vh] overflow-y-auto border-b bg-muted/20 p-3 md:max-h-[52vh] md:border-b-0 md:border-r"
              aria-label="Workspace setup sections"
            >
              <div className="space-y-5">
                {featureGroups.map((group) => (
                  <section key={group.label} aria-labelledby={`setup-group-${group.label.replaceAll(' ', '-').toLowerCase()}`}>
                    <div className="px-2 pb-2">
                      <h3
                        id={`setup-group-${group.label.replaceAll(' ', '-').toLowerCase()}`}
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground"
                      >
                        {group.label}
                      </h3>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{group.description}</p>
                    </div>
                    <div className="space-y-1">
                      {group.featureIds.map((featureId) => {
                        const feature = platformSetupFeatures.find((item) => item.id === featureId);
                        if (!feature) return null;
                        const ready = statuses.find((item) => item.id === feature.id)?.ready === true;
                        const FeatureIcon = featureIcons[feature.id];
                        const selected = selectedFeature.id === feature.id;

                        return (
                          <button
                            key={feature.id}
                            type="button"
                            aria-current={selected ? 'step' : undefined}
                            onClick={() => setSelectedFeatureId(feature.id)}
                            className={`flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                              selected
                                ? 'bg-primary/10 text-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <FeatureIcon className={`h-4 w-4 shrink-0 ${selected ? 'text-primary' : ''}`} />
                            <span className="min-w-0 flex-1 truncate text-xs font-medium">{feature.title}</span>
                            {ready ? (
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <Check className="h-3 w-3" />
                              </span>
                            ) : (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/35" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </nav>

            <div className="max-h-[52vh] min-h-[22rem] overflow-y-auto p-6 sm:p-8">
              {isLoading && statuses.length === 0 ? (
                <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking platform setup…
                </div>
              ) : (
                <div className="flex min-h-full flex-col">
                  <div className="flex items-start gap-4">
                    <SelectedFeatureIcon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold tracking-tight">{selectedFeature.title}</h2>
                        {selectedReady && <Badge variant="success">Ready</Badge>}
                        {selectedFeature.optional && <Badge variant="secondary">Optional</Badge>}
                      </div>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                        {selectedFeature.description}
                      </p>
                    </div>
                  </div>

                  <div className="my-6 border-t" />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">What this setup includes</h3>
                      <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{selectedFeature.requiredCount} required configuration {selectedFeature.requiredCount === 1 ? 'record' : 'records'} for readiness.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>
                            {selectedFeature.endpoint
                              ? 'Recommended starter data can be initialized automatically.'
                              : 'Organization-specific information is configured manually.'}
                          </span>
                        </li>
                        {selectedFeature.href ? (
                          <li className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>You can review and adjust this item later in HR Setup.</span>
                          </li>
                        ) : null}
                      </ul>
                    </div>

                    {failedFeatures[selectedFeature.id] ? (
                      <Alert variant="destructive">
                        <AlertDescription>{failedFeatures[selectedFeature.id]}</AlertDescription>
                      </Alert>
                    ) : null}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
                    {selectedFeature.href && (selectedReady || !selectedFeature.endpoint) ? (
                      <Button asChild>
                        <Link href={selectedFeature.href} onClick={() => setOpen(false)}>
                          {selectedReady ? 'Manage configuration' : 'Configure now'}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={selectedReady || isBusy}
                        onClick={() => void previewInitialization([selectedFeature.id])}
                      >
                        {activeFeature === selectedFeature.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {selectedReady ? 'Ready' : 'Initialize this default'}
                      </Button>
                    )}
                    {selectedFeature.href && selectedFeature.endpoint && !selectedReady ? (
                      <Button variant="ghost" asChild>
                        <Link href={selectedFeature.href} onClick={() => setOpen(false)}>Open configuration</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="items-center gap-2 px-6 py-4 sm:justify-between sm:space-x-0 sm:px-8">
            <Button type="button" variant="ghost" asChild>
              <Link href="/settings" onClick={() => dismiss(allReady ? 'completed' : 'dismissed')}>
                Open HR Setup
              </Link>
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {!allReady && (
                <Button type="button" variant="ghost" disabled={isBusy} onClick={() => dismiss('dismissed')}>
                  Remind me later
                </Button>
              )}
              <Button
                type="button"
                disabled={isLoading || isBusy}
                onClick={() => allReady ? dismiss('completed') : reviewRecommendedInitialization()}
              >
                {isInitializingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {allReady ? 'Continue to activation' : 'Initialize recommended defaults'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminPlatformSetupPreviewDialog
        open={isPreviewOpen}
        busy={isBusy}
        loading={isLoadingPreview}
        groups={previewGroups}
        onOpenChange={setIsPreviewOpen}
        onConfirm={() => void confirmPreviewInitialization()}
      />
    </>
  );
}
