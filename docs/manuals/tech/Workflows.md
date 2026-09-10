# Automated Workflows (N8N)

## The Story of Background Magic

| Feature | Description |
| :--- | :--- |
| **What** | A suite of server-side automations that handle heavy data tasks like AI parsing and email alerts. |
| **Who** | **System Adminstrators** and **Solution Architects**. |
| **When** | Every time a applicant applies, a stage changes, or a resume is uploaded. |
| **Why** | To ensure the user interface remains fast by offloading long-running "Think Time" tasks to N8N. |
| **Where** | Managed via the **N8N Workflow Dashboard**. |
| **How** | 1. Access the **N8N UI** <br> 2. Open `HRI [Process applicant].json` <br> 3. Verify the **Webhook Trigger** node is active <br> 4. Check **Execution Logs** for any AI scoring errors <br> 5. Restart failed workflows if needed |

## 1. Critical Workflow Paths
- **Inbound Processing**: Receives raw file data and converts it into structured applicant profiles.
- **AI Scoring Engine**: Calculates the "Fit Score" whenever job requirements change.
- **Resume Queue**: A scheduled cleanup task that processes pending MinIO files every 5 minutes.

> [!IMPORTANT]
> If N8N services are down, applicant profiles will still be created, but the **AI Fit Score** will remain at 0% until connectivity is restored.

## 2. How to Verify (Test Case)
To verify automation health:
1.  **Navigate**: Open the **N8N Dashboard** and select your primary processing workflow.
2.  **Act**: Perform a trigger action in the UI (e.g., upload a resume).
3.  **Confirm**: Check the N8N **"Executions"** tab. A new successful execution should be logged within seconds of your action.
