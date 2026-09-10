"use client";

import { useEffect, useMemo } from "react";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface UseApplicantsPageSessionGateOptions {
  sessionStatus: SessionStatus;
  replaceUrl: (href: string) => void;
}

function getCurrentAuthLocation() {
  if (typeof window === "undefined") {
    return { pathname: "", search: "" };
  }

  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

export function useApplicantsPageSessionGate({
  sessionStatus,
  replaceUrl,
}: UseApplicantsPageSessionGateOptions) {
  const gateMessage = useMemo(() => {
    if (sessionStatus === "loading") {
      return "Loading...";
    }

    if (sessionStatus !== "unauthenticated") {
      return null;
    }

    return "Redirecting to sign in...";
  }, [sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== "unauthenticated") {
      return;
    }

    const { pathname, search } = getCurrentAuthLocation();
    const isOnSigninPage = pathname === "/auth/signin";
    const isLogoutInProgress = search.includes("signout=true");

    if (!isOnSigninPage && !isLogoutInProgress) {
      replaceUrl("/auth/signin");
    }
  }, [replaceUrl, sessionStatus]);

  return gateMessage;
}
