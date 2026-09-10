"use client";

import React from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { getJsonString, readJsonObject } from "../../../../lib/response-json";

interface UseEvaluationLinkStatusOptions {
  applicantId: string;
  searchParams: ReadonlyURLSearchParams;
  sessionUser?: unknown;
}

export function useEvaluationLinkStatus({
  applicantId,
  searchParams,
  sessionUser,
}: UseEvaluationLinkStatusOptions) {
  const token = searchParams.get("token");
  const hasToken = Boolean(token);
  const [linkExpired, setLinkExpired] = React.useState(false);
  const [canReactivateLink, setCanReactivateLink] = React.useState(false);
  const [evaluationLinkRequireLogin, setEvaluationLinkRequireLogin] = React.useState<boolean | null>(true);

  const refreshEvaluationLinkStatus = React.useCallback(async () => {
    if (!applicantId) {
      return;
    }

    if (!token) {
      setLinkExpired(false);
      setCanReactivateLink(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/v1/applicants/${applicantId}/evaluation-link?token=${encodeURIComponent(token)}`,
        { credentials: "include" }
      );

      if (res.ok) {
        const data = await readJsonObject(res);
        setEvaluationLinkRequireLogin(data.requireLogin === undefined ? true : Boolean(data.requireLogin));

        const expiresAt = new Date(getJsonString(data, "expiresAt") ?? "");
        const isExpired = expiresAt < new Date();
        setLinkExpired(isExpired);
        setCanReactivateLink(isExpired && Boolean(sessionUser));
        return;
      }

      if (res.status === 404) {
        setLinkExpired(true);
        setCanReactivateLink(Boolean(sessionUser));
        setEvaluationLinkRequireLogin(null);
        return;
      }

      setEvaluationLinkRequireLogin(null);
    } catch {
      setEvaluationLinkRequireLogin(null);
    }
  }, [applicantId, sessionUser, token]);

  React.useEffect(() => {
    refreshEvaluationLinkStatus();
  }, [refreshEvaluationLinkStatus]);

  return {
    linkExpired,
    canReactivateLink,
    evaluationLinkRequireLogin,
    hasToken,
    refreshEvaluationLinkStatus,
  };
}
