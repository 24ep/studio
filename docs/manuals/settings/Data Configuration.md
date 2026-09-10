# Data Configuration

## The Story of Custom Data Structures

| Feature | Description |
| :--- | :--- |
| **What** | Tools to customize the recruitment lifecycle (Stages, Sources) and extend the database schema (Custom Fields). |
| **Who** | **System Administrators** and **HR Operations Managers**. |
| **When** | When your organization changes its hiring process or needs to track new data points like "Salary Expectations." |
| **Why** | To allow the software to grow with your business needs without requiring professional development support. |
| **Where** | **Settings > Data Configuration** and **Settings > Custom Fields**. |
| **How** | 1. Navigate to **Data Configuration** <br> 2. Select **"applicant"** entity <br> 3. Create **"Expected Salary"** field <br> 4. Choose type **"Number"** <br> 5. Click **"Save"** and verify the field appears in the Filter sidebar |

## 1. Customizing the Pipeline (Stages)
Model your real-world hiring process in the software.
1.  Navigate to **Data Configuration > Stages**.
2.  **Reorder**: Drag and drop stages (e.g., move "Technical Test" before "Manager Interview").
3.  **Add New**: Click **"Add Stage"** > Name it (e.g., "Culture Fit").
4.  **SLA**: Set max days allowed in this stage (e.g., *2 days*) to trigger alerts.

## 2. Source & Field Management
Monitor where your best applicants come from and what data you collect.

### 2.1 applicant Sources
1.  Navigate to **Data Configuration > Sources**.
2.  **Add**: Type a new source (e.g., `LinkedIn`, `JobDB`, `Internal Referral`) and save.
3.  **Active/Inactive**: Toggle data points off instead of deleting them to preserve historical records.

### 2.2 Job Grades & SLA
Standardize seniority levels and hiring speed expectations.
1.  Navigate to **Data Configuration > Grades**.
2.  Define levels (e.g., `L1: Junior`, `L2: Mid-Level`).
3.  **Set Targets**: Assign a "Time to Fill" target (e.g., *30 days*) for each grade. This drives the Logic in the *SLA Monitoring* dashboard.

## 3. Skills Library Management (CRUD)
Maintain a clean dictionary of technical and soft skills for AI matching.
*   **Location**: **Settings > Skills**.
*   **Create**: Click **"Add Skill"**. Enter name (e.g., "React.js") and Category (e.g., "Frontend").
*   **Update**: Fix typos or merge duplicates (e.g., "ReactJS" -> "React.js").
*   **Delete**: Remove obsolete skills. *Warning: This removes the skill tag from all historical applicant profiles.*

*   **Delete**: Remove obsolete skills. *Warning: This removes the skill tag from all historical applicant profiles.*

## 4. Personality Traits Configuration
Define the soft traits and behavioral indicators used for "Culture Fit" analysis.
*   **Location**: **Settings > Personality Traits**.
*   **Groups**: Organize traits into buckets (e.g., "Leadership", "Communication").
*   **Traits**: Add specific indicators (e.g., "Empathy", "Assertiveness") that the AI should scan for.

## 5. Evaluation Configuration
Define how applicants are scored by the hiring team.
1.  Navigate to **Settings > Evaluation Configuration**.
2.  **Scorecard Templates**: Create standard question sets for different roles (e.g., "Engineering Interview" vs "Sales Interview").
3.  **Rating Scale**: Customize the 1-5 star definitions (e.g., 1 = "Strong No", 5 = "Strong Hire").
4.  **Feedback Categories**: specific buckets for open-ended comments (e.g., "Cultural Add", "Technical Capability").

> [!NOTE]
> System-protected stages (Applied, Hired, Rejected) cannot be deleted as they are tied to core analytics functions.

## 2. How to Verify (Test Case)
To verify custom data:
1.  **Navigate**: Go to **"Settings > Custom Fields"**.
2.  **Act**: Create a new field for the **"Position"** entity named "Internal ID".
3.  **Confirm**: Open any Position record. The new "Internal ID" field should appear in the details section, allowing you to enter data.
