# V1 Notifications API

This API provides endpoints for sending custom notifications to users and retrieving user notifications.

## Authentication

All endpoints require Bearer token authentication. Include your API token in the Authorization header:

```
Authorization: Bearer YOUR_API_TOKEN
```

## Endpoints

### GET /api/v1/notifications

Retrieve notifications for the authenticated user with pagination and filtering.

**Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 50, max: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `isRead` (optional): Filter by read status (true/false)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "applicant_added",
      "title": "New applicant Added",
      "message": "A new applicant has been added to your position",
      "data": {},
      "isRead": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "unreadCount": 5,
  "limit": 50,
  "offset": 0
}
```

### POST /api/v1/notifications

Send custom notifications. Supports both single and bulk notifications.

**Permissions Required:** `applicantS_MANAGE` or Admin role

#### Single Notification

**Request Body:**
```json
{
  "type": "custom_notification",
  "title": "Important Update",
  "message": "Your account has been updated",
  "targetUserId": "optional-user-id", // Optional, defaults to current user
  "data": {
    "actionUrl": "/settings",
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "message": "Notification sent successfully",
  "notification": {
    "id": "uuid",
    "type": "custom_notification",
    "title": "Important Update",
    "message": "Your account has been updated",
    "data": {},
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Bulk Notifications

**Request Body:**
```json
{
  "notifications": [
    {
      "type": "system_alert",
      "title": "System Maintenance",
      "message": "System will be down for maintenance",
      "targetUserId": "user-id-1",
      "data": {
        "maintenanceTime": "2024-01-01T02:00:00Z"
      }
    },
    {
      "type": "reminder",
      "title": "Task Reminder",
      "message": "You have pending tasks to review",
      "targetUserId": "user-id-2",
      "data": {
        "taskCount": 5
      }
    }
  ]
}
```

**Response:**
```json
{
  "message": "Bulk notifications processed",
  "results": {
    "sent": 2,
    "failed": 0,
    "errors": []
  }
}
```

## Notification Types

The system supports various notification types:

- `applicant_added` - When a new applicant is assigned to a recruiter
- `recruiter_assigned` - When a recruiter is assigned to a position
- `applicant_status_change` - When applicant status changes
- `custom_notification` - Custom notifications
- `system_alert` - System-wide alerts
- `reminder` - Task reminders
- Any custom type you define

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": {
    "type": ["Notification type is required"],
    "title": ["Notification title is required"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions to send notifications"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error sending notification",
  "details": {
    "originalError": "Database connection failed"
  }
}
```

## Examples

### Send a notification to yourself
```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reminder",
    "title": "Daily Reminder",
    "message": "Don\'t forget to check your applicants today!"
  }'
```

### Send a notification to a specific user
```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom_notification",
    "title": "Welcome!",
    "message": "Welcome to our recruitment platform",
    "targetUserId": "user-uuid-here",
    "data": {
      "welcomeGift": "free_premium_month"
    }
  }'
```

### Get user notifications
```bash
curl -X GET "http://localhost:3000/api/v1/notifications?limit=10&isRead=false" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Send bulk notifications
```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": [
      {
        "type": "system_alert",
        "title": "New Feature Available",
        "message": "Check out our new AI-powered applicant matching!",
        "targetUserId": "user-1-uuid"
      },
      {
        "type": "system_alert",
        "title": "New Feature Available",
        "message": "Check out our new AI-powered applicant matching!",
        "targetUserId": "user-2-uuid"
      }
    ]
  }'
```

## Integration with Automatic Notifications

This API works alongside the automatic notification system. When applicants are created via the V1 API, notifications are automatically sent to assigned recruiters. You can use this API to send additional custom notifications as needed.

## Real-time Notifications

Notifications sent via this API are also broadcast in real-time to connected clients through the SSE system, so users will see them immediately if they have the application open.
