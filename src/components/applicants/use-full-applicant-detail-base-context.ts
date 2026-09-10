"use client";

import { useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { useInterviewInvitationFeature } from "@/hooks/useInterviewInvitationFeature";
import { useJobMatchFeature } from "@/hooks/useJobMatchFeature";
import { useIsMobile } from "@/hooks/use-mobile";
import { useApplicantQrLogo } from "./hooks/use-applicant-qr-logo";

export function useFullApplicantDetailBaseContext({ onRefresh }: { onRefresh: () => void }) {
  const { data: session } = useSession();
  const { isJobMatchEnabled } = useJobMatchFeature();
  const { isInterviewInvitationEnabled } = useInterviewInvitationFeature();
  const { success: toastSuccess, error: toastError } = useToast();
  const isMobile = useIsMobile();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const appLogoUrl = useApplicantQrLogo();
  const [activeTab, setActiveTab] = useState<string>("jobs");

  const handleCommentsChange = useCallback((options?: { refreshApplicantData?: boolean }) => {
    if (options?.refreshApplicantData) {
      onRefresh();
    }
  }, [onRefresh]);

  return {
    activeTab,
    appLogoUrl,
    avatarInputRef,
    handleCommentsChange,
    isInterviewInvitationEnabled,
    isJobMatchEnabled,
    isMobile,
    session,
    setActiveTab,
    toastError,
    toastSuccess,
  };
}
