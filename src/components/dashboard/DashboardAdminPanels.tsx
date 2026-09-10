"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { HrisUnifiedTaskInbox } from "@/components/hris/HrisUnifiedTaskInbox";
import {
  OnboardingProgress,
  type OnboardingProgressPayload,
  type RawOnboardingStep,
} from "@/components/onboarding/OnboardingProgress";
import { hasAnyPermission } from "@/lib/permissions";

type NavigateHandler = (href: string) => void;

interface AdminPortalOnboardingResponse {
  onboarding?: {
    steps?: RawOnboardingStep[];
    progress?: {
      completed: number;
      percentage: number;
      total: number;
    };
    subtitle?: string;
    title?: string;
  };
  progress?: {
    completed: number;
    percentage: number;
    total: number;
  };
}

const emptyAdminOnboardingPayload: OnboardingProgressPayload = {
  title: "Activate your workspace",
  subtitle:
    "Complete the real organization tasks required before inviting your wider team. Progress is saved automatically.",
  steps: [],
  progress: {
    completed: 0,
    total: 0,
    percentage: 0,
  },
};

export function DashboardAdminPortalPanel({
  onNavigate,
}: {
  onNavigate: NavigateHandler;
}) {
  const [progressPayload, setProgressPayload] = useState<OnboardingProgressPayload>(
    emptyAdminOnboardingPayload,
  );
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isPanelDismissed, setIsPanelDismissed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);

    const loadAdminSnapshots = async () => {
      setIsLoadingProgress(true);
      try {
        const response = await fetch("/api/settings/platform-setup/status", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          setProgressPayload(emptyAdminOnboardingPayload);
          return;
        }

        const payload = (await response.json()) as AdminPortalOnboardingResponse;
        const steps = Array.isArray(payload.onboarding?.steps)
          ? payload.onboarding.steps
          : [];
        const fallbackProgress = payload.onboarding?.progress || payload.progress;
        const requiredSteps = steps.filter((step) => step.required);
        const fallbackCalculatedCompleted = requiredSteps.filter(
          (step) => step.ready,
        ).length;

        setProgressPayload({
          title: payload.onboarding?.title ?? emptyAdminOnboardingPayload.title,
          subtitle:
            payload.onboarding?.subtitle ?? emptyAdminOnboardingPayload.subtitle,
          steps,
          progress: fallbackProgress
            ? {
                completed: fallbackProgress.completed,
                percentage: fallbackProgress.percentage,
                total: fallbackProgress.total,
              }
            : {
                completed: fallbackCalculatedCompleted,
                total: requiredSteps.length,
                percentage:
                  requiredSteps.length === 0
                    ? 100
                    : Math.round(
                        (fallbackCalculatedCompleted / requiredSteps.length) * 100,
                      ),
              },
        });
      } catch (error) {
        console.error("Failed to load admin onboarding progress.", error);
        setProgressPayload({
          title: "Workspace setup needs attention",
          subtitle:
            "Setup progress could not be loaded. Open HR Setup to review configuration and service connectivity.",
          steps: [
            {
              id: "setup-recovery",
              title: "Review HR Setup",
              description:
                "Check required modules and retry the setup status service.",
              href: "/settings",
              required: true,
              ready: false,
              count: 0,
              requiredCount: 1,
              actionLabel: "Open HR Setup",
            },
          ],
          progress: { completed: 0, total: 1, percentage: 0 },
        });
      } finally {
        window.clearTimeout(timeoutId);
        setIsLoadingProgress(false);
      }
    };

    void loadAdminSnapshots();
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  if (isPanelDismissed) return null;

  return (
    <section
      className="dashboard-card dashboard-full-panel onboarding-dashboard-panel"
      aria-labelledby="admin-portal-onboarding-title"
    >
      <OnboardingProgress
        onNavigate={onNavigate}
        isLoading={isLoadingProgress}
        payload={progressPayload}
        onDismiss={() => setIsPanelDismissed(true)}
      />
    </section>
  );
}

export function DashboardRoleWorkspace({
  onNavigate,
}: {
  onNavigate: NavigateHandler;
}) {
  const { data: session } = useSession();
  const user = session?.user;
  const destinations = [
    {
      label: "My workspace",
      description: "Profile, leave, attendance, documents, and learning",
      href: "/employee-portal",
      show: true,
    },
    {
      label: "My team",
      description: "Direct reports, approvals, and manager actions",
      href: "/ess/team",
      show:
        user?.role === "Hiring Manager" ||
        hasAnyPermission(user, ["HR_WORKFORCE_VIEW", "HR_WORKFORCE_MANAGE"]),
    },
    {
      label: "People operations",
      description: "Employee records, movements, probation, and cases",
      href: "/people",
      show: hasAnyPermission(user, ["HR_PEOPLE_VIEW", "HR_PEOPLE_MANAGE"]),
    },
    {
      label: "Payroll & finance",
      description: "Runs, exceptions, expenses, and reconciliation",
      href: "/payroll",
      show: hasAnyPermission(user, [
        "HR_PAYROLL_VIEW",
        "HR_PAYROLL_MANAGE",
        "EXPENSES_FINANCE",
      ]),
    },
  ].filter((destination) => destination.show);

  return (
    <section
      className="dashboard-card dashboard-full-panel p-5"
      aria-labelledby="role-workspace-title"
    >
      <div className="mb-4">
        <h2
          id="role-workspace-title"
          className="text-base font-semibold text-foreground"
        >
          Your HR workspace
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shortcuts and pending work are scoped to your role and permissions.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {destinations.map((destination) => (
          <button
            key={destination.href}
            type="button"
            onClick={() => onNavigate(destination.href)}
            className="min-h-11 rounded-xl border border-border/70 bg-background p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-sm font-semibold text-foreground">
              {destination.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              {destination.description}
            </span>
          </button>
        ))}
      </div>
      <HrisUnifiedTaskInbox />
    </section>
  );
}
