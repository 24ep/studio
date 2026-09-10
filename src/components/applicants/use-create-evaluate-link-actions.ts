"use client";

import { useCallback } from "react";
import { toast } from "react-hot-toast";

import {
  createApplicantEvaluationLink,
  sendCreateEvaluateLinkInvitationEmails,
} from "./create-evaluate-link-api";
import {
  buildEvaluationLinkPayload,
  buildInvitationEmailPayload,
  copyCreateEvaluateLinkToClipboard,
  downloadCreateEvaluateLinkQrCode,
  getCreateEvaluateLinkErrorMessage,
  shouldSendCreateEvaluateLinkInvitation,
  type CreateEvaluateLinkApplicantInfo,
  type CreateEvaluateLinkStep,
} from "./create-evaluate-link-utils";

interface CreateEvaluateLinkActionsInput {
  applicant: CreateEvaluateLinkApplicantInfo;
  duration: number;
  emailBody: string;
  emailSubject: string;
  expireDays: number;
  interviewDate?: Date;
  interviewTime: string;
  invitationEnabled: boolean;
  location: string;
  locationEmail?: string;
  onSuccess?: (linkInfo: { url: string; expiresAt: string }) => void;
  requireLogin: boolean;
  selectedInterviewerIds: Set<string>;
  sendEmail: boolean;
  setCopied: (copied: boolean) => void;
  setCurrentStep: (step: CreateEvaluateLinkStep) => void;
  setLinkInfo: (linkInfo: { url: string; expiresAt: string }) => void;
  setLoading: (loading: boolean) => void;
}

export function useCreateEvaluateLinkActions({
  applicant,
  duration,
  emailBody,
  emailSubject,
  expireDays,
  interviewDate,
  interviewTime,
  invitationEnabled,
  location,
  locationEmail,
  onSuccess,
  requireLogin,
  selectedInterviewerIds,
  sendEmail,
  setCopied,
  setCurrentStep,
  setLinkInfo,
  setLoading,
}: CreateEvaluateLinkActionsInput) {
  const sendInvitationEmails = useCallback(async (evaluationUrl: string) => {
    try {
      const result = await sendCreateEvaluateLinkInvitationEmails({
        applicantId: applicant.id,
        payload: buildInvitationEmailPayload({
          selectedInterviewerIds,
          interviewDate,
          interviewTime,
          duration,
          location,
          locationEmail,
          emailSubject,
          emailBody,
          evaluationLink: evaluationUrl,
        }),
      });

      if (result.sentCount > 0) {
        toast.success(`Email sent to ${result.sentCount || selectedInterviewerIds.size} interviewer(s)`);
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Link created but failed to send emails");
    }
  }, [
    applicant.id,
    duration,
    emailBody,
    emailSubject,
    interviewDate,
    interviewTime,
    location,
    locationEmail,
    selectedInterviewerIds,
  ]);

  const createLink = useCallback(async (skipEmail = false) => {
    setLoading(true);
    try {
      const linkData = await createApplicantEvaluationLink({
        applicantId: applicant.id,
        payload: buildEvaluationLinkPayload({
          expireDays,
          requireLogin,
          interviewDate,
          interviewTime,
          location,
        }),
      });
      setLinkInfo({ url: linkData.url, expiresAt: linkData.expiresAt });

      if (shouldSendCreateEvaluateLinkInvitation({
        skipEmail,
        sendEmail,
        invitationEnabled,
        selectedInterviewerCount: selectedInterviewerIds.size,
      })) {
        await sendInvitationEmails(linkData.url);
      }

      setCurrentStep("success");
      onSuccess?.({ url: linkData.url, expiresAt: linkData.expiresAt });
      toast.success("Evaluation link created");
    } catch (error) {
      console.error("Error creating link:", error);
      toast.error(getCreateEvaluateLinkErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [
    applicant.id,
    expireDays,
    interviewDate,
    interviewTime,
    invitationEnabled,
    location,
    onSuccess,
    requireLogin,
    selectedInterviewerIds.size,
    sendEmail,
    sendInvitationEmails,
    setCurrentStep,
    setLinkInfo,
    setLoading,
  ]);

  const copyLink = useCallback((url?: string | null) => {
    if (!url) return;

    void copyCreateEvaluateLinkToClipboard(url);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }, [setCopied]);

  const downloadQR = useCallback(() => {
    downloadCreateEvaluateLinkQrCode({ applicantName: applicant.name });
  }, [applicant.name]);

  return {
    copyLink,
    createLink,
    downloadQR,
  };
}
