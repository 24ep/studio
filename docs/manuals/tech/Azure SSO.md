# Azure AD Integration & SSO

## The Story of Secure Access

| Feature | Description |
| :--- | :--- |
| **What** | Enterprise-grade authentication and calendar sync with Microsoft Azure Active Directory. |
| **Who** | **IT Security Leads** and **Azure Portal Admins**. |
| **When** | During initial tenant setup or when enabling Meeting Room booking capabilities. |
| **Why** | To enforce corporate security policies and provide a "One-Click" login experience. |
| **Where** | **Settings > System Settings > Azure Integration**. |
| **How** | 1. Enter **Client ID** & **Tenant ID** <br> 2. Input **Client Secret** <br> 3. Click **"Test Connection"** <br> 4. Toggle **"Enable SSO"** to ON <br> 5. Sync **Meeting Rooms** for interview scheduling |

## 1. Permission Prerequisites
Ensure your Azure App Registration has the correct delegated and application permissions:
- `User.Read`: For identity validation during login.
- `Places.Read.All`: Required if you wish to sync physical office meeting rooms.

> [!WARNING]
> Enabling SSO will disable local email/password login for all users unless the **"Basic Auth Fallback"** toggle is also enabled in System Settings.

## 2. How to Verify (Test Case)
To test the Azure connection:
1.  **Navigate**: Enter your credentials in the **"Azure Integration"** settings.
2.  **Act**: Click the **"Test Connection"** or **"Validate Token"** button.
3.  **Confirm**: A green "Success" toast should appear, indicating that the application can successfully communicate with the Microsoft Graph API.
