import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'react-hot-toast';

import type { Applicant } from '@/lib/types';
import {
  addPositionInterviewers,
  sendInterviewInvitation,
} from './send-interview-invitation-api';
import {
  getInterviewInvitationErrorMessage,
  getInterviewInvitationResultMessage,
} from './send-interview-invitation-modal-utils';

interface UseSendInterviewInvitationActionsOptions {
  applicant: Applicant;
  duration: number;
  emailBody: string;
  emailSubject: string;
  interviewDate?: Date;
  interviewTime: string;
  loadInterviewers: () => Promise<void>;
  location: string;
  locationEmail: string;
  notes: string;
  onOpenChange: (open: boolean) => void;
  selectedInterviewerIds: Set<string>;
  selectedUserIds: Set<string>;
  setAddInterviewerOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedInterviewerIds: Dispatch<SetStateAction<Set<string>>>;
  setSelectedUserIds: (ids: Set<string>) => void;
}

export function useSendInterviewInvitationActions({
  applicant,
  duration,
  emailBody,
  emailSubject,
  interviewDate,
  interviewTime,
  loadInterviewers,
  location,
  locationEmail,
  notes,
  onOpenChange,
  selectedInterviewerIds,
  selectedUserIds,
  setAddInterviewerOpen,
  setError,
  setSelectedInterviewerIds,
  setSelectedUserIds,
}: UseSendInterviewInvitationActionsOptions) {
  const [loading, setLoading] = useState(false);
  const [addingInterviewers, setAddingInterviewers] = useState(false);

  const handleAddInterviewers = useCallback(async () => {
    if (selectedUserIds.size === 0 || !applicant.positionId) return;

    setAddingInterviewers(true);
    const userIdsArray = Array.from(selectedUserIds);

    try {
      const { successCount, errorCount } = await addPositionInterviewers(applicant.positionId, userIdsArray);

      if (successCount > 0) {
        toast.success(`${successCount} interviewer${successCount > 1 ? 's' : ''} added successfully`);
        await loadInterviewers();
        setSelectedInterviewerIds((currentIds) => {
          const nextIds = new Set(currentIds);
          userIdsArray.forEach((userId) => nextIds.add(userId));
          return nextIds;
        });
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} failed to add`);
      }

      setSelectedUserIds(new Set());
      setAddInterviewerOpen(false);
    } catch (err) {
      console.error('Error adding interviewers:', err);
      toast.error('Failed to add interviewers');
    } finally {
      setAddingInterviewers(false);
    }
  }, [
    applicant.positionId,
    loadInterviewers,
    selectedUserIds,
    setAddInterviewerOpen,
    setSelectedInterviewerIds,
    setSelectedUserIds,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!interviewDate) {
      toast.error('Please select an interview date');
      return;
    }

    if (!emailSubject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    if (!emailBody.trim()) {
      toast.error('Please enter email content');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await sendInterviewInvitation({
        applicant,
        selectedInterviewerIds,
        interviewDate,
        interviewTime,
        duration,
        location,
        locationEmail,
        notes,
        emailSubject,
        emailBody,
      });
      const successCount = data.results?.length || 0;
      const errorCount = data.errors?.length || 0;
      const message = getInterviewInvitationResultMessage({ errorCount, successCount });

      if (errorCount > 0) {
        toast.success(message, { duration: 5000 });
      } else {
        toast.success(message);
      }

      onOpenChange(false);
    } catch (err) {
      console.error('Error sending invitations:', err);
      const errorMessage = getInterviewInvitationErrorMessage(err, 'Failed to send invitations');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    applicant,
    duration,
    emailBody,
    emailSubject,
    interviewDate,
    interviewTime,
    location,
    locationEmail,
    notes,
    onOpenChange,
    selectedInterviewerIds,
    setError,
  ]);

  return {
    addingInterviewers,
    handleAddInterviewers,
    handleSubmit,
    loading,
  };
}
