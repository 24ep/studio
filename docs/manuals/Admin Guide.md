# Admin Guide: The Architect's Overview

## The Story of Platform Governance

| Feature | Description |
| :--- | :--- |
| **What** | The master control guide for setting up and maintaining the HRI ecosystem. |
| **Who** | **System Administrators** and **HR Operations Leads**. |
| **When** | From initial tenant provisioning through to long-term scaling and security audits. |
| **Why** | To ensure the platform remains secure, compliant, and perfectly tuned to the organization's hiring DNA. |
| **Where** | The **Settings** module and the **SLA Monitoring** dashboard. |
| **How** | 1. Log in as **Super Admin** <br> 2. Configure **SSO & Branding** <br> 3. Define **Teams & RBAC** <br> 4. Tune **AI Matching** logic <br> 5. Monitor **Health & Logs** regularly |

## Functional Areas

Explore the specific guides below to manage your HRI environment:

### ⚙️ Identity & Setup
- **[User Management](./admin/User%20Management.md)**: Add users and define their access levels.
- **[System Configuration](./admin/System%20Configuration.md)**: Features, branding, and global toggles.
- **[Azure SSO](./admin/Azure%20SSO%20Integration.md)**: Microsoft AD connectivity and room sync.

### 📊 Operations & Governance
- **[Data Configuration](./admin/Data%20Configuration.md)**: Stages, sources, and custom database fields.
- **[SLA Monitoring](./admin/SLA%20Monitoring.md)**: Global compliance tracking and violation alerts.
- **[System Prompts](./admin/System%20Prompts.md)**: Fine-tuning the AI's matching behavior.

### 🛠️ Maintenance & Technical
- **[Integrations](./admin/Integrations.md)**: Webhooks and secure API access.
- **[Automated Workflows](./admin/Automated%20Workflows.md)**: Behind-the-scenes N8N logic.
- **[Security & Auditing](./admin/Security.md)**: Logs and session management.
- **[CLI Tools](./admin/CLI%20Tools.md)**: Server-side maintenance scripts.

## How to Verify (E2E Test)
To verify your Admin setup is correct:
1.  **Identity**: Create a new user in **"User Management"** and assign them the **"Recruiter"** role.
2.  **Access**: Log in as that new user.
3.  **Confirm**: Ensure they can see the **"applicants"** list but **cannot** access the **"Settings > System settings"** menu. This confirms your RBAC engine is operational.
