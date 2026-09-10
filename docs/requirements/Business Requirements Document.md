# Business Requirements Document (BRD)

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Approved
**Classification:** Internal

---

## 1. Executive Summary

### 1.1 Project Background
The current recruitment landscape faces challenges in efficiency and quality. Manual resume screening processes are time-consuming, subjective, and prone to bias, leading to extended "Time-to-Hire" metrics and suboptimal applicant placement. Communication gaps between recruiters and hiring managers further delay decision-making.

HRI Enterprise is proposed as a centralized Applicant Tracking System (ATS) designed to address these core inefficiencies. By integrating Generative AI for objective applicant scoring and facilitating real-time collaboration for interview panels, HRI aims to modernize the end-to-end hiring lifecycle.

### 1.2 Business Goals
1.  **Metric Improvement**: Reduce "Time-to-Hire" by 40% within the first 6 months of deployment.
2.  **Process Automation**: Automate 80% of initial resume data entry and screening through AI parsing.
3.  **Collaboration**: Transition 100% of internal feedback collection from email/Excel to the centralized platform.
4.  **Mobility**: Empower decision-makers with a fully functional mobile interface for approvals and evaluations on-the-go.

---

## 2. Business Scope

### 2.1 In-Scope Functionality
The project encompasses the following modules and capabilities:

*   **applicant Acquisition & Management**:
    *   Resume ingestion (PDF/DOCX) with intelligent data extraction (OCR + NLP).
    *   Automated duplicate detection logic based on email/phone heuristics.
    *   Unified applicant profiles aggregating resume data, interview history, and documents.
*   **Job Requisition Management**:
    *   Creation of detailed job postings with automated approval workflows.
    *   Headcount tracking (Approved vs. Filled slots) with SLA monitoring.
    *   Interviewer assignment and scheduling coordination.
*   **Intelligent Screening (AI)**:
    *   "Fit Score" calculation (0-100%) grading applicants against specific job descriptions.
    *   Automated summarization of key strengths and weaknesses.
*   **Collaborative Evaluation**:
    *   Digital scorecards for functional skills and personality traits.
    *   Real-time synchronization of scores during panel interviews.
    *   Mobile-first evaluation interface for convenience.
*   **Administration & Compliance**:
    *   Role-Based Access Control (RBAC) separating Recruiters, Hiring Managers, and Admins.
    *   SSO Integration (Azure Active Directory).
    *   Comprehensive audit logs for all create/update/delete actions.

### 2.2 Out-of-Scope Functionality
*   **External Job Board Integration**: No direct posting to platforms like LinkedIn or Indeed in Phase 1.
*   **Video Conferencing**: Hosting video calls is excluded; usage will rely on external links (Teams/Zoom).
*   **Payroll/HRIS**: Post-hiring onboarding and payroll processing are handled by external systems.

### 2.3 User Personas
1.  **The Recruiter (Primary User)**: Sourcing applicants, managing pipelines, performing initial screens. Needs efficiency and bulk tools.
2.  **The Hiring Manager (Decision Maker)**: Creating job reqs, reviewing shortlisted applicants, making final hiring decisions. Needs mobile access and clear summaries.
3.  **The Viewer/Interviewer**: Subject matter experts conducting technical interviews. Needs a simple, focused evaluation interface.
4.  **The Administrator**: IT staff managing users, permissions, and system configuration.

---

## 3. High-Level Requirements Matrix

### 3.1 Functionality
| ID | Req Type | Description | Priority |
|:---|:---|:---|:---|
| **BR-FUNC-001** | **Core Automation** | The system must parse text from uploaded PDF/DOCX resumes and map it to a structured database schema without manual intervention. | **Critical** |
| **BR-FUNC-002** | **AI Matching** | The system must generate a quantitative score (0-100) indicating the relevance of a applicant's profile to the job description. | **Critical** |
| **BR-FUNC-003** | **Access Control** | The system must prevent unauthorized users from viewing salary or sensitive applicant data based on their Role (e.g., Hiring Manager vs Recruiter). | **High** |
| **BR-FUNC-004** | **Mobility** | All "Approval" and "Evaluation" workflows must be fully executable on mobile devices (iOS/Android browsers). | **High** |
| **BR-FUNC-005** | **Real-Time Sync** | Updates made by one user (e.g., changing a status) must be reflected instantly on other active users' screens to prevent conflicts. | **Medium** |
| **BR-FUNC-006** | **Search & Discovery** | Users must be able to search applicants using natural language queries (e.g., "Find Java developers with 5 years experience"). | **High** |
| **BR-FUNC-007** | **Workflow Automation** | The system must integrate with N8N to trigger external workflows (e.g., email notifications, Slack alerts) on key events. | **Medium** |
| **BR-FUNC-008** | **Audit Trail** | Every create, update, and delete action must be logged with a timestamp, user ID, and change diff for compliance. | **Critical** |
| **BR-FUNC-009** | **Custom Data** | Admins must be able to define custom fields for applicants and Positions without code changes. | **Low** |
| **BR-FUNC-010** | **Identity Management** | The system must support both local email/password authentication and Enterprise SSO (Azure AD). | **Critical** |
| **BR-FUNC-011** | **Headcount & SLA** | The system must enforce position headcount limits and track "Time-to-Hire" against defined SLA targets for each grade. | **High** |
| **BR-FUNC-012** | **Analytics Dashboard** | Users must have access to visual dashboards showing pipeline health, applicant sources, and recruitment velocity. | **Medium** |
| **BR-FUNC-013** | **In-App Notifications** | Use must receive real-time in-app alerts for assigned tasks, mentions, and status changes. | **Medium** |
| **BR-FUNC-014** | **Data Export** | Admins must be able to export applicant and evaluation data (CSV/Excel) for external reporting. | **Low** |
| **BR-FUNC-015** | **Two-Factor Auth** | The system must support Time-based One-Time Password (TOTP) 2FA for enhanced administrator security. | **Medium** |
| **BR-FUNC-016** | **Rich Text Posting** | Users must be able to format job descriptions using rich text (bold, lists, links) via an integrated editor. | **Medium** |
| **BR-FUNC-017** | **Kanban Management** | Users must be able to move applicants between stages using a drag-and-drop Kanban board interface. | **Medium** |
| **BR-FUNC-018** | **PWA Support** | The application must be installable as a Progressive Web App (PWA) with offline capabilities and home screen icon. | **High** |
| **BR-FUNC-019** | **API Security** | The system must implement Rate Limiting and strict CORS policies to prevent abuse and unauthorized cross-origin requests. | **Critical** |
| **BR-FUNC-020** | **Data Hygiene** | The system must provide automated scripts/tools to detect and merge duplicate applicants and cleanup orphaned files. | **Low** |
| **BR-FUNC-021** | **System Health** | Administrators must have access to a dashboard monitoring database connection, MinIO status, and queue health. | **Medium** |
| **BR-FUNC-022** | **Bulk Import** | Recruiters must be able to bulk upload multiple resumes (ZIP or multi-select) in a single action for background processing. | **High** |
| **BR-FUNC-023** | **Webhook Resilience** | The system must support configurable retry logic and connection timeouts for all outbound webhook integrations. | **Medium** |

### 3.2 Non-Functional
| ID | Req Type | Description | Priority |
|:---|:---|:---|:---|
| **BR-NF-001** | **Performance** | The "applicant List" page must load under 2 seconds for a volume of up to 10,000 records. | **High** |
| **BR-NF-002** | **Security** | All Personal Identifiable Information (PII) must be encrypted at rest and in transit (TLS 1.2+). | **Critical** |
| **BR-NF-003** | **Availability** | The system must target 99.9% uptime during business hours (8 AM - 8 PM). | **High** |
| **BR-NF-004** | **Scalability** | The architecture must support horizontal scaling of the web tier to handle 500+ concurrent users. | **Medium** |
| **BR-NF-005** | **Usability (Mobile)** | Critical mobile flows must typically require no more than 3 taps to complete a primary action (e.g., "Approve"). | **High** |
| **BR-NF-006** | **Maintainability** | The code must adhere to the Sustainable Engineering guidelines (Strict TypeScript, CI/CD checks). | **Medium** |
| **BR-NF-007** | **Observability** | The system must emit structured logs for all API errors and successful background jobs. | **High** |
| **BR-NF-008** | **Compatibility** | The application must be fully functional on the last 2 major versions of Chrome, Edge, Safari, and Firefox. | **High** |
| **BR-NF-009** | **Data Integrity** | The system must perform automated daily backups with a Recovery Point Objective (RPO) of 24 hours. | **Critical** |
| **BR-NF-010** | **Resource Optimization** | The database connection pool must be configured to handle idle timeouts and max connections to prevent exhaustion under load. | **High** |
| **BR-NF-011** | **File Security** | Access to applicant attachments must be strictly controlled via signed URLs, with an option to toggle public access for debugging. | **Critical** |

---

## 4. Risks & Dependencies

### 4.1 Key Risks
*   **Data Accuracy**: AI parsing may potentially misinterpret complex or non-standard resume formats. Mitigation: Provide manual override capabilities for all parsed fields.
*   **Adoption Friction**: Hiring managers accustomed to email workflows may resist platform adoption. Mitigation: Focus heavily on mobile UX simplicity.

### 4.2 Dependencies
*   **Azure AD**: Corporate SSO infrastructure must be stable for authentication.
*   **Google GenAI**: Availability and quota limits of the AI service provider affect the "Fit Score" feature.

---

## 5. Approval
| Name | Role | Date | Signature |
|:---|:---|:---|:---|
| -- | Project Sponsor | -- | -- |
| -- | Product Owner | -- | -- |
| -- | Lead Architect | -- | -- |
