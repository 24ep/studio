# Performance & SLA Monitoring

## The Story of Accountability

| Feature | Description |
| :--- | :--- |
| **What** | Automated monitoring of recruitment speed and efficiency. |
| **Who** | **Recruiters** and **Regional Managers** tracking team performance. |
| **When** | Real-time tracking during the lifecycle of every applicant. |
| **Why** | To maintain high service standards and ensure applicants don't "drop out" due to slow response times. |
| **Where** | On the **Kanban Board** (visual alerts) and **Reports** module. |
| **How** | 1. Set SLA threshold in Settings <br> 2. Monitor **Time-in-Stage** <br> 3. Look for pulsing **Warning Icons** on Kanban <br> 4. Check Dashboard for overdue alerts |

## 1. Critical Metrics
- **SLA (Service Level Agreement)**: The target time allowed for a applicant to stay in a stage (e.g., Screening should take < 48 hours).
- **Time to Fill**: The total duration from job opening to offer acceptance.

## 2. Visual Stagnation Alerts
The system helps you spot problems before they escalate:
- **Warning Icons**: Cards on the Kanban board will pulse or show a warning icon if they exceed the SLA threshold.
- **Overdue Tasks**: Dashboard widgets will prioritize actions for applicants who have been waiting the longest.

## 3. How to Verify (Test Case)
To test SLA visualization:
1.  **Navigate**: Find a applicant card on the **Kanban board** that has been in a stage for less than 1 hour.
2.  **Act**: Temporarily set the SLA threshold for that stage to **30 minutes** in System Settings.
3.  **Confirm**: Return to the Kanban board. The card should now display a warning indicator or pulse to signal an SLA violation.

