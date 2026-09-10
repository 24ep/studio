# System Maintenance

## The Story of Health and Stability

| Feature | Description |
| :--- | :--- |
| **What** | Tools for monitoring infrastructure health, managing data snapshots, and performance tuning. |
| **Who** | **IT Administrators** and **Infrastructure Teams**. |
| **When** | Before major updates, during detected outages, or as part of a weekly health audit. |
| **Why** | To guarantee data integrity and ensure the recruitment team suffers zero downtime. |
| **Where** | In the **Settings > Maintenance** and **Settings > System Status** tabs. |
| **How** | 1. Check **System Status Dashboard** <br> 2. Verify Database/Storage connectivity <br> 3. Click **"Manual Backup"** <br> 4. Click **"Clear System Cache"** to refresh state |

## 1. Health Monitoring (The Pulse)
The **System Status Dashboard** provides a live check on critical infrastructure dependencies:
- **PostgreSQL**: Checks if the core database is responsive and healthy.
- **MinIO/S3**: Verifies that resume storage buckets are accessible for reading and writing.
- **Azure AD connection**: Confirms if the SSO integration is correctly communicating.

## 2. Data Management
- **Manual Backups**: Trigger an immediate database snapshot before performing risky configuration changes.
- **Cache Clearing**: Force the platform to refresh its local state (useful if AI skills or team definitions aren't updating).

## 3. The Process Queue
Monitor background tasks such as email sending, AI parsing, and report generation.
*   **Access**: Click the **"Process Queue"** icon in the bottom-left sidebar.
*   **Status Indicators**:
    *   **Processing**: Task is currently running.
    *   **Completed**: Successfully finished.
    *   **Failed**: Click to view error details and "Retry".

## 4. Application Logs
Debug system behavior by viewing the raw event stream.
1.  Navigate to **Settings > Application Logs**.
2.  **Search & Filter**: Type keywords (e.g., "Error", "Email", "User ID") in the search bar to isolate specific events.
3.  **Details**: Click on a log row to see the full stack trace or event payload.

> [!CAUTION]
> Clearing the system cache may cause temporary slowdowns for active users as the platform regenerates its indexes.

## 3. How to Verify (Test Case)
To verify system health:
1.  **Navigate**: Open the **"System Status"** dashboard in Settings.
2.  **Act**: Look for the green connectivity indicators next to **"Database"** and **"Storage"**.
3.  **Confirm**: All core services should show "Online". If any show "Offline", follow the on-screen troubleshooting steps or contact technical support.
