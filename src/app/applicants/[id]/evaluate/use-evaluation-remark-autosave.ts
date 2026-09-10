import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { buildSharedInterviewRemarkAttributes, getSharedInterviewRemarks } from './utils';
import { isJsonObject, readJsonOrFallback } from '../../../../lib/response-json';
import type { EvaluationFormData } from './types';

interface UseEvaluationRemarkAutosaveProps {
  applicantId: string;
  applicantData: EvaluationFormData['applicant'] | null;
  setApplicantData: (applicant: EvaluationFormData['applicant']) => void;
}

function normalizeApplicantUpdateResponse(
  value: unknown,
  fallback: EvaluationFormData['applicant'] | null
): EvaluationFormData['applicant'] | null {
  if (!isJsonObject(value)) {
    return fallback;
  }

  const applicant = value.applicant ?? value.Applicant ?? value;
  return isJsonObject(applicant) ? applicant as unknown as EvaluationFormData['applicant'] : fallback;
}

export function useEvaluationRemarkAutosave({
  applicantId,
  applicantData,
  setApplicantData,
}: UseEvaluationRemarkAutosaveProps) {
  const [remarkText, setRemarkText] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);
  const [remarkSaved, setRemarkSaved] = useState(false);
  const remarkTextareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (applicantData) {
      setRemarkText(getSharedInterviewRemarks(applicantData));
    }
  }, [applicantData]);

  const resizeRemarkTextarea = useCallback((textarea?: HTMLTextAreaElement | null) => {
    const target = textarea || remarkTextareaRef.current;
    if (target) {
      target.style.height = 'auto';
      target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
    }
  }, []);

  const saveRemark = useCallback(async (text: string) => {
    if (!applicantId) return;

    try {
      setSavingRemark(true);
      const updatedCustomAttributes = buildSharedInterviewRemarkAttributes(applicantData, text);

      const response = await fetch(`/api/applicants/${applicantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          custom_attributes: updatedCustomAttributes,
        }),
      });

      if (response.ok) {
        const result = normalizeApplicantUpdateResponse(
          await readJsonOrFallback<unknown>(response, null),
          applicantData
        );
        if (result) {
          setApplicantData(result);
        }
        setRemarkSaved(true);

        if (savedStatusTimeoutRef.current) {
          clearTimeout(savedStatusTimeoutRef.current);
        }
        savedStatusTimeoutRef.current = setTimeout(() => setRemarkSaved(false), 2000);
      } else {
        const errorData = await readJsonOrFallback<{ message?: string }>(response, {
          message: 'Failed to save remark',
        });
        toast.error(errorData.message || 'Failed to save remark');
      }
    } catch (error) {
      console.error('Error saving remark:', error);
      toast.error('Failed to save remark');
    } finally {
      setSavingRemark(false);
    }
  }, [applicantData, applicantId, setApplicantData]);

  const handleRemarkChange = useCallback((
    text: string,
    event?: ChangeEvent<HTMLTextAreaElement>,
    debounceMs = 2000,
  ) => {
    setRemarkText(text);
    resizeRemarkTextarea(event?.target);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveRemark(text);
    }, debounceMs);
  }, [resizeRemarkTextarea, saveRemark]);

  useEffect(() => {
    resizeRemarkTextarea();
  }, [remarkText, resizeRemarkTextarea]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedStatusTimeoutRef.current) {
        clearTimeout(savedStatusTimeoutRef.current);
      }
    };
  }, []);

  return {
    remarkText,
    setRemarkText,
    savingRemark,
    remarkSaved,
    handleRemarkChange,
  };
}
