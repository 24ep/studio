/**
 * Utility functions for creating and managing notifications
 */

export interface CreateNotificationParams {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  targetUserId?: string;
}

/**
 * Create a notification for a specific user or the current user
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const response = await fetch('/api/realtime/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('Failed to create notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Create a notification for Applicant updates
 */
export async function createApplicantNotification(
  applicantId: string,
  applicantName: string,
  action: 'created' | 'updated' | 'deleted' | 'moved' | 'commented',
  additionalData?: Record<string, unknown>
): Promise<boolean> {
  const messages = {
    created: `New applicant ${applicantName} has been added`,
    updated: `Applicant ${applicantName} has been updated`,
    deleted: `Applicant ${applicantName} has been removed`,
    moved: `Applicant ${applicantName} has been moved to a new stage`,
    commented: `New comment added for applicant ${applicantName}`,
  };

  return createNotification({
    type: 'Applicant_update',
    title: `Applicant ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    message: messages[action],
    data: {
      applicantId: applicantId,
      applicantName,
      action,
      ...additionalData,
    },
  });
}

/**
 * Create a notification for position updates
 */
export async function createPositionNotification(
  positionId: string,
  positionTitle: string,
  action: 'created' | 'updated' | 'deleted' | 'opened' | 'closed',
  additionalData?: Record<string, unknown>
): Promise<boolean> {
  const messages = {
    created: `New position "${positionTitle}" has been created`,
    updated: `Position "${positionTitle}" has been updated`,
    deleted: `Position "${positionTitle}" has been removed`,
    opened: `Position "${positionTitle}" has been opened`,
    closed: `Position "${positionTitle}" has been closed`,
  };

  return createNotification({
    type: 'position_update',
    title: `Position ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    message: messages[action],
    data: {
      positionId,
      positionTitle,
      action,
      ...additionalData,
    },
  });
}

/**
 * Create a notification for user actions
 */
export async function createUserNotification(
  userId: string,
  userName: string,
  action: 'logged_in' | 'logged_out' | 'profile_updated' | 'password_changed',
  additionalData?: Record<string, unknown>
): Promise<boolean> {
  const messages = {
    logged_in: `${userName} has logged in`,
    logged_out: `${userName} has logged out`,
    profile_updated: `${userName} has updated their profile`,
    password_changed: `${userName} has changed their password`,
  };

  return createNotification({
    type: 'user_action',
    title: `User ${action.replace('_', ' ').charAt(0).toUpperCase() + action.replace('_', ' ').slice(1)}`,
    message: messages[action],
    data: {
      userId,
      userName,
      action,
      ...additionalData,
    },
  });
}

/**
 * Create a notification for system events
 */
export async function createSystemNotification(
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  additionalData?: Record<string, unknown>
): Promise<boolean> {
  return createNotification({
    type: `system_${type}`,
    title,
    message,
    data: {
      systemEvent: true,
      severity: type,
      ...additionalData,
    },
  });
}

/**
 * Create a notification for task board updates
 */
export async function createTaskBoardNotification(
  taskId: string,
  taskTitle: string,
  action: 'created' | 'updated' | 'completed' | 'assigned',
  additionalData?: Record<string, unknown>
): Promise<boolean> {
  const messages = {
    created: `New task "${taskTitle}" has been created`,
    updated: `Task "${taskTitle}" has been updated`,
    completed: `Task "${taskTitle}" has been completed`,
    assigned: `Task "${taskTitle}" has been assigned to you`,
  };

  return createNotification({
    type: 'task_update',
    title: `Task ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    message: messages[action],
    data: {
      taskId,
      taskTitle,
      action,
      ...additionalData,
    },
  });
}
