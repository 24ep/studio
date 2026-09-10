# Position Management Module

## The Story of a Job Opening

| Feature | Description |
| :--- | :--- |
| **What** | The central hub for creating, managing, and filling job requisitions. |
| **Who** | **Recruiters** (Owners) and **Hiring Managers** (Collaborators). |
| **When** | From the moment a need is identified until the role is filled. |
| **Why** | To organize applicants, track headcount, and ensure clear requirements (JD) are distributed. |
| **Where** | **Positions** module. |
| **How** | 1. **Create Position** (Basic Info) <br> 2. **Config Team** (Add Manager) <br> 3. **Set Headcount** <br> 4. **Generate JD** <br> 5. **Publish** |

## 1. Creating a Position
The lifecycle begins with a "Quick Create" modal.
1.  Click **"New Position"**.
2.  **Basic Info**:
    *   **Title**: Internal title (e.g., "Senior React Dev").
    *   **Department**: For budget tracking.
    *   **Recruiter**: The primary owner.
3.  Click **"Add Position"**. The role is created in "Draft" mode.

## 2. Configuring the Position (The Drawer)
Deep configuration happens in the Position Drawer, organized by tabs.

### 2.1 Details Tab
The command center for the position's core data.
*   **Job Description**: Use the **AI Generator** to draft a JD based on the title.
*   **Status**: Toggle between `Open` (Public), `Closed` (Filled), or `Draft`.
*   **Metadata**: Edit Title, Department, and Level.

### 2.2 Criteria Tab
Configure the "brain" of the AI matching engine for this specific role.
*   **Match Criteria**: Define the prompt instructions (e.g., "Must have 5 years of Python").
*   **Default Criteria**: Load the system-wide baseline to save time.

### 2.3 applicants Tab
A mini-pipeline view specific to this position.
*   **Applied**: applicants who explicitly applied for this Job ID.
*   **Potential**: (AI Powered) applicants in your database who match the criteria *but haven't applied yet*. Good for rediscovery.
*   **Pinning**: "Pin" top applicants to keep them at the top of the list.

### 2.4 Headcount Tab
Manage the quota for this requisition.
*   **Slots**: Define how many hires are approved (e.g., 3 openings).
*   **Hired Count**: Automatically increments when a applicant is moved to "Hired" stage.
*   **Pipeline**: See which specific applicants are filling the slots.

### 2.5 Interviewers Tab
Define the Hiring Team.
*   **Add Member**: select users who need access to this position.
*   **Roles**:
    *   *Recruiter*: Full edit access.
    *   *Interviewer*: Can only evaluate applicants.
    *   *Hiring Manager*: Can see pipeline and approve/reject.

### 2.6 Evaluate Tab
Link the position to the Evaluation Module.
*   **Scorecards**: Select which interview template to use (e.g., "Engineering Technical Screen").
*   **Skills**: Override default skills if this role requires unique checks (e.g., adding "Rust" to a "General Dev" role).

## 3. Publishing
Once configured, toggle the status to **"Open"** in the **Details Tab**.
*   The position becomes visible in the " Careers Page" (if integrated) and available for applicant assignment.
