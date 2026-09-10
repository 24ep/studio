"use client";

import { useEffect } from "react";
import { Loader2, ServerCrash } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DashboardGuardStateProps {
  fetchError?: string | null;
  onGoHome?: () => void;
  onReload?: () => void;
  onSignIn?: () => void;
}

export function DashboardLoadingScreen() {
  return (
    <div className="flex w-screen items-center justify-center bg-background fixed inset-0 z-50">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}

export function DashboardAuthErrorState({ fetchError, onSignIn }: DashboardGuardStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
      <ServerCrash className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold text-foreground mb-2">Authentication Error</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        {fetchError || "You need to be signed in to view the dashboard."}
      </p>
      <Button onClick={onSignIn} className="btn-hover-primary-gradient">
        Sign In
      </Button>
    </div>
  );
}

export function DashboardPermissionIssueState({ fetchError, onGoHome, onReload }: DashboardGuardStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
      <ServerCrash className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold text-foreground mb-2">Permission Issue Detected</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        {fetchError || "There seems to be an issue with your permissions. This can happen if your role or permissions were recently updated."}
      </p>
      <div className="flex gap-2">
        <Button onClick={onReload} className="btn-hover-primary-gradient">
          Reload Page
        </Button>
        <Button onClick={onGoHome} variant="outline">
          Go to Home
        </Button>
      </div>
    </div>
  );
}

export function DashboardDataErrorState({ fetchError }: Pick<DashboardGuardStateProps, "fetchError">) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
      <ServerCrash className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold text-foreground mb-2">Data Loading Error</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Could not load dashboard data: {fetchError}
      </p>
    </div>
  );
}

export function DashboardAccessRedirectState({
  redirectTo,
  onRedirect,
}: {
  redirectTo: string;
  onRedirect: (href: string) => void;
}) {
  useEffect(() => {
    onRedirect(redirectTo);
  }, [onRedirect, redirectTo]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">
        Redirecting to {redirectTo === "/my-tasks" ? "My Tasks" : redirectTo === "/positions" ? "Positions" : "Applicants"}...
      </p>
    </div>
  );
}
