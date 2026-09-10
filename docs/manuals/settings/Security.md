# Security & Auditing

## The Story of Platform Integrity

| Feature | Description |
| :--- | :--- |
| **What** | A centralized hub for monitoring active user sessions, login attempts, and an immutable history of data changes. |
| **Who** | **DPO (Data Privacy Officers)** and **System Architects**. |
| **When** | During scheduled security audits or when investigating suspicious account activity. |
| **Why** | To maintain GDPR and ISO compliance by providing proof of who accessed what data and when. |
| **Where** | **Settings > Security** and **Settings > Audit Logs**. |
| **How** | 1. Go to **Settings > Audit Logs** <br> 2. Filter by **Action: DELETE** <br> 3. Click any entry to see the JSON diff <br> 4. Go to **Security Dashboard** <br> 5. Monitor **Failed Logins** and unlock accounts if necessary |

## 1. Data Preservation
- **Audit Diff**: Every change to a applicant or Position record is logged with a "Before" and "After" snapshot.
- **Session Control**: Admins can immediately terminate all active sessions if a corporate security threat is detected.

> [!CAUTION]
> Audit logs are immutable and cannot be deleted or modified by any user, including the Super Admin.

## 2. How to Verify (Test Case)
To test audit transparency:
1.  **Navigate**: Go to **"Settings > Audit Logs"**.
2.  **Act**: Perform a change in any applicant profile (e.g., change the phone number) and save.
3.  **Confirm**: Return to **"Audit Logs"** and click the most recent entry. The "Details" should show the exact field that was changed and its new value.
