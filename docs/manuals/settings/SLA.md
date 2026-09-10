# SLA Monitoring & Governance

## The Story of Continuous Compliance

| Feature | Description |
| :--- | :--- |
| **What** | A governance dashboard that tracks time-sensitive hiring milestones across all active roles. |
| **Who** | **Regional HR Directors** and **Adminstrators**. |
| **When** | During weekly business reviews (WBR) to identify departments that are falling behind. |
| **Why** | To ensure every position is filled within the agreed-upon timeframe and to protect the applicant experience. |
| **Where** | Found in the main navigation under **SLA Monitoring**. |
| **How** | 1. Open **SLA Monitoring** <br> 2. Filter by **"Severity: Critical"** <br> 3. Identify the position with the highest violation days <br> 4. Click to see the specific headcount <br> 5. Coordinate with the recruiter to accelerate the process |

## 1. The Severity Ladder
- **On Track (Green)**: Proceeding normally within the defined limits.
- **Severity 1 (Yellow)**: Approaching target; needs attention.
- **Severity 2-4 (Red)**: SLA Violated; requires immediate escalation.

> [!IMPORTANT]
> SLA targets are automatically assigned based on the Job Grade (e.g., G10 roles have longer fill-time allowances than G1 roles).

## 2. How to Verify (Test Case)
To verify SLA logic:
1.  **Navigate**: Open an active **Position** that has a Grade but no headcounts yet.
2.  **Act**: Add a new headcount with a **"Request Date"** that is 30 days in the past.
3.  **Confirm**: Go to the **"SLA Monitoring"** dashboard. The position should now appear with a **Red (Violated)** status and show "30 days overdue".
