import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-hot-toast';

import { createApplicantReminder, fetchApplicantReminders } from '../applicant-comments-api';
import type { ApplicantReminderItem } from '../applicant-comments-utils';

export interface ApplicantCommentsCounts {
  all: number;
  comment: number;
  remark: number;
  activity: number;
}

interface UseApplicantRemindersParams {
  applicantId: string;
  setCounts: Dispatch<SetStateAction<ApplicantCommentsCounts>>;
  onCommentsChange: () => void;
}

export function useApplicantReminders({
  applicantId,
  setCounts,
  onCommentsChange,
}: UseApplicantRemindersParams) {
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date());
  const [reminderTime, setReminderTime] = useState('09:00');
  const [creatingReminder, setCreatingReminder] = useState(false);
  const [reminders, setReminders] = useState<ApplicantReminderItem[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      setRemindersLoading(true);
      const fetchedReminders = await fetchApplicantReminders(applicantId);
      if (fetchedReminders) {
        setReminders(fetchedReminders);

        setCounts(prev => ({
          ...prev,
          all: prev.comment + prev.remark + prev.activity + fetchedReminders.length,
          remark: prev.remark + fetchedReminders.length,
          activity: prev.activity + fetchedReminders.length,
        }));
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setRemindersLoading(false);
    }
  }, [applicantId, setCounts]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleCreateReminder = useCallback(async () => {
    if (!reminderDate || !reminderTitle.trim()) return;

    setCreatingReminder(true);
    try {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const combinedDate = new Date(reminderDate);
      combinedDate.setHours(hours, minutes, 0, 0);

      await createApplicantReminder({
        applicantId,
        title: reminderTitle,
        reminderDate: combinedDate.toISOString(),
      });

      toast.success('Reminder created successfully');
      setIsReminderDialogOpen(false);
      setReminderTitle('');
      fetchReminders();
      onCommentsChange();
    } catch (err) {
      console.error('Error creating reminder:', err);
      toast.error('Failed to create reminder');
    } finally {
      setCreatingReminder(false);
    }
  }, [applicantId, fetchReminders, onCommentsChange, reminderDate, reminderTime, reminderTitle]);

  return {
    creatingReminder,
    handleCreateReminder,
    isReminderDialogOpen,
    reminderDate,
    reminderTime,
    reminderTitle,
    reminders,
    remindersLoading,
    setIsReminderDialogOpen,
    setReminderDate,
    setReminderTime,
    setReminderTitle,
  };
}
