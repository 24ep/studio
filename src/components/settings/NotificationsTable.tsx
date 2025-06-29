import React from 'react';

interface NotificationsTableProps {
  notifications: any[];
  isLoading: boolean;
  onEdit: (notification: any) => void;
}

const NotificationsTable: React.FC<NotificationsTableProps> = ({ notifications, isLoading, onEdit }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Notification Settings</h2>
      {notifications.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No notification settings found.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{notification.type || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground">{notification.channel || 'No channel'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${notification.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {notification.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => onEdit(notification)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsTable; 