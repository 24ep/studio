import React from 'react';

interface NotificationsFormProps {
  open: boolean;
  notification: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const NotificationsForm: React.FC<NotificationsFormProps> = ({ open, notification, onClose, onSubmit }) => {
  if (!open) return null;
  return (
    <div>
      <h2>Notifications Form</h2>
      {/* Notifications form UI here */}
    </div>
  );
};

export default NotificationsForm; 