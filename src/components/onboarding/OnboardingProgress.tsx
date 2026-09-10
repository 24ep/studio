"use client";

import { ArrowRight, CircleCheckBig, CircleMinus, CirclePlus, Flag, X } from "lucide-react";

export interface RawOnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  required: boolean;
  ready: boolean;
  count: number;
  requiredCount: number;
  metadata?: string;
  actionLabel?: string;
}

export interface OnboardingStepStatus {
  id: string;
  title: string;
  description: string;
  href: string;
  required: boolean;
  ready: boolean;
  count: number;
  requiredCount: number;
  metadata?: string;
  actionLabel?: string;
  status: "completed" | "current" | "incomplete" | "optional";
  progressPercent: number;
  nextHint?: string;
}

export interface OnboardingProgressPayload {
  title: string;
  subtitle: string;
  steps: RawOnboardingStep[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildStepStatus(step: RawOnboardingStep): OnboardingStepStatus {
  const progressPercent = clampPercent((Math.min(step.count, step.requiredCount) / Math.max(1, step.requiredCount)) * 100);
  const isOptional = step.required === false;
  return {
    ...step,
    status: isOptional ? "optional" : "incomplete",
    progressPercent,
  };
}

function normalizeSteps(steps: RawOnboardingStep[]): OnboardingStepStatus[] {
  const safeSteps = steps.map(buildStepStatus);
  const nextRequired = safeSteps.find((step) => step.required && !step.ready);

  return safeSteps.map((step) => {
    if (step.ready) return { ...step, status: "completed" as const };
    if (nextRequired?.id === step.id) return { ...step, status: "current" as const, nextHint: "Current next action" };
    return step;
  });
}

function getProgressFromSteps(steps: RawOnboardingStep[]) {
  const requiredSteps = steps.filter((step) => step.required);
  const completed = requiredSteps.filter((step) => step.ready).length;
  const total = requiredSteps.length;
  const percentage = total === 0 ? 100 : Math.round((completed / total) * 100);
  return {
    completed,
    total,
    percentage,
  };
}

export function OnboardingHeader({
  title,
  subtitle,
  onDismiss,
  showDismiss,
}: {
  title: string;
  subtitle: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}) {
  return (
    <header className="onboarding-header">
      <div className="onboarding-header-top">
        <span className="onboarding-header-icon" aria-hidden="true">
          <Flag className="onboarding-header-icon__glyph" />
        </span>
        {showDismiss && onDismiss ? (
          <button
            className="onboarding-close-button"
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss onboarding"
          >
            <X className="onboarding-close-button__icon" />
          </button>
        ) : null}
      </div>
      <p className="onboarding-eyebrow">GETTING STARTED</p>
      <h2 className="onboarding-title">{title}</h2>
      <p className="onboarding-subtitle">{subtitle}</p>
    </header>
  );
}

export function ProgressBar({
  label,
  percentage,
}: {
  label: string;
  percentage: number;
}) {
  return (
    <div className="onboarding-progress-wrap" aria-label={label} aria-live="polite">
      <div className="onboarding-progress-meta">
        <span className="onboarding-progress-meta__label">{label}</span>
        <span className="onboarding-progress-meta__value">{percentage}%</span>
      </div>
      <div
        className="onboarding-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <span className="onboarding-progress-fill" style={{ transform: `scaleX(${percentage / 100})` }} />
      </div>
    </div>
  );
}

export function OnboardingSummary({
  completed,
  total,
  isComplete,
}: {
  completed: number;
  total: number;
  isComplete: boolean;
}) {
  const percentage = total === 0 ? 100 : Math.round((completed / total) * 100);

  return (
    <div className="onboarding-summary">
      <div className="onboarding-summary-headline">
        <span className="onboarding-summary-title">{completed} of {total} complete</span>
        <strong className="onboarding-summary-count">{percentage}%</strong>
      </div>
      <ProgressBar
        label={`${completed} of ${total} required module${total === 1 ? "" : "s"} configured`}
        percentage={percentage}
      />
      {isComplete ? (
        <p className="onboarding-step-hint">Setup complete - your workspace is ready to use.</p>
      ) : null}
    </div>
  );
}

export function OnboardingStep({
  metadata,
  nextHint,
  progressPercent,
  status,
  actionLabel: actionLabelOverride,
  stepDescription,
  stepTitle,
  href,
  onNavigate,
}: {
  href: string;
  metadata?: string;
  nextHint?: string;
  actionLabel?: string;
  onNavigate: (href: string) => void;
  progressPercent: number;
  status: OnboardingStepStatus["status"];
  stepDescription: string;
  stepTitle: string;
}) {
  const isCurrent = status === "current";
  const isCompleted = status === "completed";
  const isOptional = status === "optional";
  const actionLabel = actionLabelOverride
    || (isCompleted
    ? "Manage"
    : isOptional
      ? "Review"
      : "Next \u2192");
  const visualClass = `onboarding-step-visual onboarding-step-visual--${status}`;

  return (
    <li className={`onboarding-step onboarding-step--${status}`} aria-current={isCurrent ? "step" : undefined}>
      <div className="onboarding-step-main">
        <span className={visualClass}>
          {isCompleted ? (
            <CircleCheckBig className="onboarding-step-icon is-success" aria-hidden="true" />
          ) : isCurrent ? (
            <CirclePlus className="onboarding-step-icon is-current" aria-hidden="true" />
          ) : isOptional ? (
            <CircleMinus className="onboarding-step-icon is-optional" aria-hidden="true" />
          ) : (
            <CircleMinus className="onboarding-step-icon is-muted" aria-hidden="true" />
          )}
        </span>
      <div className="onboarding-step-copy">
        <div className="onboarding-step-title-row">
            <h3 className={`onboarding-step-title ${isCompleted ? "is-completed" : ""}`}>{stepTitle}</h3>
          </div>
          <p className="onboarding-step-description">{stepDescription}</p>
          <p className="onboarding-step-meta" aria-live="polite">{metadata || `${progressPercent}% configured`}</p>
          {nextHint ? <p className="onboarding-step-hint">{nextHint}</p> : null}
        </div>
      </div>

      <button
        className="onboarding-step-action"
        type="button"
        onClick={() => onNavigate(href)}
      >
        {actionLabel}
        <ArrowRight className="onboarding-step-action__icon" aria-hidden="true" />
      </button>
    </li>
  );
}

export function OnboardingChecklist({
  onNavigate,
  steps,
}: {
  onNavigate: (href: string) => void;
  steps: OnboardingStepStatus[];
}) {
  return (
    <ol className="onboarding-checklist" aria-label="Onboarding module checklist">
      {steps.map((step) => (
        <OnboardingStep
          key={step.id}
          href={step.href}
          metadata={step.metadata}
          actionLabel={step.actionLabel}
          nextHint={step.nextHint}
          onNavigate={onNavigate}
          progressPercent={step.progressPercent}
          status={step.status}
          stepDescription={step.description}
          stepTitle={step.title}
        />
      ))}
    </ol>
  );
}

export function OnboardingProgress({
  onNavigate,
  payload,
  isLoading,
  onDismiss,
}: {
  isLoading: boolean;
  onNavigate: (href: string) => void;
  payload?: OnboardingProgressPayload;
  onDismiss?: () => void;
}) {
  const resolvedPayload: OnboardingProgressPayload | null = payload && payload.steps.length > 0
    ? {
      ...payload,
      progress: payload.progress ? payload.progress : getProgressFromSteps(payload.steps),
    }
    : null;
  const normalizedSteps = resolvedPayload?.steps.length
    ? normalizeSteps(resolvedPayload.steps)
    : [];
  const completed = resolvedPayload?.progress?.completed || 0;
  const total = resolvedPayload?.progress?.total || 0;
  const allRequiredCompleted = total > 0 && completed >= total;
  const showDismiss = allRequiredCompleted && Boolean(onDismiss);

  if (isLoading) {
    return (
      <div className="onboarding-shell" role="status" aria-live="polite">
        <section className="onboarding-summary-panel">
          <OnboardingHeader
            title="Loading onboarding progress"
            subtitle="Checking required modules and setup flow for your workspace."
            onDismiss={onDismiss}
            showDismiss={showDismiss}
          />
          <div className="onboarding-skeleton">
            <div className="onboarding-skeleton-line onboarding-skeleton-line--title" />
            <div className="onboarding-skeleton-line onboarding-skeleton-line--bar" />
          </div>
        </section>
        <div className="onboarding-divider" aria-hidden="true" />
        <section className="onboarding-checklist-panel">
          <div className="onboarding-skeleton">
            <div className="onboarding-skeleton-line onboarding-skeleton-line--title" />
            <div className="onboarding-skeleton-line onboarding-skeleton-line--bar" />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="onboarding-shell">
      <section className="onboarding-summary-panel">
        <OnboardingHeader
          title={resolvedPayload?.title ?? "Admin onboarding progress"}
          subtitle={resolvedPayload?.subtitle ?? "Complete the required modules before rolling out to teams."}
          onDismiss={onDismiss}
          showDismiss={showDismiss}
        />
        <OnboardingSummary completed={completed} total={total} isComplete={allRequiredCompleted} />
      </section>
      <div className="onboarding-divider" aria-hidden="true" />
      <section className="onboarding-checklist-panel">
        {normalizedSteps.length === 0 ? (
          <p className="onboarding-empty-state">No onboarding steps are currently configured.</p>
        ) : (
          <OnboardingChecklist steps={normalizedSteps} onNavigate={onNavigate} />
        )}
      </section>
    </div>
  );
}



