# System Configuration

## The Story of Platform Tuning

| Feature | Description |
| :--- | :--- |
| **What** | Global toggles and branding settings that define the platform's behavior. |
| **Who** | **System Administrators** with full backend access. |
| **When** | During initial deployment or when launching new hiring initiatives. |
| **Why** | To ensure the platform scales with your company and reflects your corporate identity. |
| **Where** | Under the **Settings > System Settings** navigation item. |
| **How** | 1. Go to **Settings > System Settings** <br> 2. Toggle **AI Matching** (or other flags) <br> 3. Update **Logo URL** <br> 4. Change **Hex Colors** <br> 5. Save and refresh page to verify |

## 1. Feature Toggles (Modular Logic)
Activate or deactivate entire segments of the app without code changes:
- **AI Matching**: Connect or disconnect the Google Gemini engine for applicant scoring.
- **Basic Auth**: Allow or block fallback login methods (email/password) alongside SSO.
- **Recruiter Sync**: Automate the assignment of incoming applicants to the correct recruitment owner.

## 2. Branding (Identity Work)
Make the platform feel like home:
- **Dynamic Logos**: Replace the default HRI branding with your company's SVG/PNG logo.
- **Core Theming**: Adjust the primary and secondary hex colors to align with your brand guidelines.

## 3. Email Configuration
Manage outgoing communication standards.
- **SMTP Settings**: Connect your own mail server (Office 365, SendGrid) to verify sender identity.
- **Templates**:
    1.  Navigate to **Settings > Email Templates**.
    2.  Customize automated messages for:
        *   *Application Acknowledgement*
        *   *Interview Invite*
        *   *Rejection Letter*

- **Templates**: Configure `Application Acknowledgement`, `Interview Invite`, and `Rejection Letter` automation.

## 4. Automation & AI Configuration
Advanced logic controls for the recruiting engine.

### 4.1 Recruiter Assignment Sync
Ensure every applicant has an owner.
*   **Automatic**: When a applicant applies to a Position, they are auto-assigned to that Position's recruiter.
*   **Manual Sync**: Use the **"Sync All"** button in **Settings > Recruiter Sync** to retroactively fix unassigned applicants (e.g., after bulk imports).

### 4.2 AI API Keys
Manage the connection to Google Gemini.
*   **Rotate Keys**: If a key is compromised, paste a new one here immediately.
*   **Usage Monitoring**: Check quota usage (requests per minute) to ensure service continuity.

## 5. Webhooks & Integrations
Connect HRI to your wider ecosystem.
*   **Location**: **Settings > Webhooks**.
*   **Create Webhook**: Define a URL endpoint (e.g., Slack or Zapier) to receive JSON payloads when events occur (e.g., `applicant Hired`, `Application Received`).
*   **Logs**: View a history of delivery attempts and response codes for debugging.

## 6. Automation Rules
Keep your database clean automatically.
*   **Auto-Close**: Configure rules to automatically close positions or reject applicants after a set period of inactivity (e.g., "Reject applicants in 'New' status after 60 days").

## 7. Team Management
Organize users into functional groups.
*   **Location**: **Settings > User Teams**.
*   **Create Team**: Group users (e.g., "Engineering Hiring Team") to simplify permission assignment and reporting.

## 5. How to Verify (Test Case)
To test branding updates:
1.  **Navigate**: Go to **"Settings > System Settings"**.
2.  **Act**: Change the **"App Name"** to "Demo Hire" and upload a temporary logo. Save.
3.  **Confirm**: Refresh your browser. Verify the title in the browser tab and the sidebar logo have updated to reflect the new identity.

