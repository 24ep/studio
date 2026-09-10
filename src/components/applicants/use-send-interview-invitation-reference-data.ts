import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  fetchAvailableUsers,
  fetchMeetingRooms,
  fetchPositionInterviewers,
  type Interviewer,
  type MeetingRoom,
  type User,
} from './send-interview-invitation-api';
import {
  getFilteredAvailableInterviewUsers,
  getInterviewInvitationErrorMessage,
  toggleIdSelection,
} from './send-interview-invitation-modal-utils';

interface UseSendInterviewInvitationReferenceDataOptions {
  isOpen: boolean;
  positionId?: string | null;
  setError: (error: string | null) => void;
}

export function useSendInterviewInvitationReferenceData({
  isOpen,
  positionId,
  setError,
}: UseSendInterviewInvitationReferenceDataOptions) {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<Set<string>>(new Set());
  const [loadingInterviewers, setLoadingInterviewers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [locationType, setLocationType] = useState<'room' | 'custom'>('custom');

  const loadInterviewers = useCallback(async () => {
    if (!positionId) return;

    setLoadingInterviewers(true);
    setError(null);

    try {
      const data = await fetchPositionInterviewers(positionId);
      setInterviewers(data);
      setSelectedInterviewerIds(new Set(data.map((interviewer) => interviewer.userId)));
    } catch (err) {
      console.error('Error loading interviewers:', err);
      setError(getInterviewInvitationErrorMessage(err, 'Failed to load interviewers'));
      toast.error('Failed to load interviewers');
    } finally {
      setLoadingInterviewers(false);
    }
  }, [positionId, setError]);

  const loadAvailableUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      setAvailableUsers(await fetchAvailableUsers());
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const data = await fetchMeetingRooms();
      setRooms(data);
      if (data.length > 0) {
        setLocationType('room');
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && positionId) {
      void loadInterviewers();
      void loadAvailableUsers();
    } else if (isOpen && !positionId) {
      setError('Applicant is not associated with a position');
    }
  }, [isOpen, loadAvailableUsers, loadInterviewers, positionId, setError]);

  useEffect(() => {
    if (isOpen) {
      void loadRooms();
    }
  }, [isOpen, loadRooms]);

  const toggleInterviewer = useCallback((userId: string) => {
    setSelectedInterviewerIds((currentIds) => toggleIdSelection(currentIds, userId));
  }, []);

  const resetReferenceData = useCallback(() => {
    setSelectedInterviewerIds(new Set());
    setLocationType('custom');
  }, []);

  const filteredAvailableUsers = useMemo(() => (
    getFilteredAvailableInterviewUsers(availableUsers, interviewers)
  ), [availableUsers, interviewers]);

  return {
    availableUsers,
    filteredAvailableUsers,
    interviewers,
    loadingInterviewers,
    loadingRooms,
    loadingUsers,
    loadInterviewers,
    locationType,
    resetReferenceData,
    rooms,
    selectedInterviewerIds,
    setLocationType,
    setSelectedInterviewerIds,
    toggleInterviewer,
  };
}
