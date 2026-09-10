"use client";

import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  type ApplicantEvaluationLinkInfo,
  createOrGetApplicantEvaluationLink,
  fetchApplicantEvaluationLink,
  removeApplicantEvaluationLink,
} from './applicant-evaluation-modal-api';

export function useApplicantEvaluationLinkState({
  applicantId,
  canViewLinks,
}: {
  applicantId?: string;
  canViewLinks: boolean;
}) {
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkInfo, setLinkInfo] = useState<ApplicantEvaluationLinkInfo | null>(null);
  const [expireDays, setExpireDays] = useState<number>(7);
  const [requireLogin, setRequireLogin] = useState<boolean>(true);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState<boolean>(false);

  const fetchEvaluationLink = useCallback(async () => {
    if (!applicantId) return;
    if (!canViewLinks) {
      setLinkInfo(null);
      return;
    }

    try {
      setLinkLoading(true);
      const linkState = await fetchApplicantEvaluationLink(applicantId);
      if (!linkState) {
        setLinkInfo(null);
        return;
      }

      setLinkInfo(linkState.linkInfo);
      setRequireLogin(linkState.requireLogin);
      setExpireDays(linkState.expireDays);
    } catch {
      setLinkInfo(null);
    } finally {
      setLinkLoading(false);
    }
  }, [applicantId, canViewLinks]);

  const createOrGetLink = useCallback(async (force = false) => {
    if (!applicantId) return;

    try {
      setLinkLoading(true);
      const linkState = await createOrGetApplicantEvaluationLink({
        applicantId,
        expireDays,
        requireLogin,
        force,
      });

      setLinkInfo(linkState.linkInfo);
      setRequireLogin(linkState.requireLogin);
      setExpireDays(linkState.expireDays);

      toast.success(force ? 'Evaluation link recreated' : linkState.existing ? 'Existing evaluation link loaded' : 'Evaluation link created');

      if (!linkState.existing) {
        Promise.resolve().then(() => {
          setShowLinkModal(true);
        });
      }
    } catch {
      toast.error('Failed to create evaluation link');
    } finally {
      setLinkLoading(false);
    }
  }, [applicantId, expireDays, requireLogin]);

  const removeLink = useCallback(async () => {
    if (!applicantId) return;

    try {
      setLinkLoading(true);
      await removeApplicantEvaluationLink(applicantId);
      setLinkInfo(null);
      toast.success('Evaluation link removed');
    } catch {
      toast.error('Failed to remove evaluation link');
    } finally {
      setLinkLoading(false);
    }
  }, [applicantId]);

  return {
    createOrGetLink,
    expireDays,
    fetchEvaluationLink,
    linkInfo,
    linkLoading,
    removeLink,
    requireLogin,
    setExpireDays,
    setRequireLogin,
    setShowCreateLinkModal,
    setShowLinkModal,
    showCreateLinkModal,
    showLinkModal,
  };
}
