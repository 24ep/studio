# Business Requirements Document (BRD) - Candidate Matching ATS

## 1. Executive Summary

This document outlines the business requirements for the Candidate Matching Applicant Tracking System (ATS). The project aims to develop a modern, web-based platform to streamline the recruitment process by efficiently managing candidate information, job positions, user interactions, and system configurations. The ATS will serve as a central hub for recruiters, hiring managers, and administrators to collaborate and track applicants from initial application to hiring, with enhanced control and customization.

## 2. Project Objectives

| Objective                                       | Description                                                                                                                                         |
| :---------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| Develop a functional ATS prototype              | Create a working application demonstrating core ATS functionalities with enhanced administrative controls.                                          |
| Streamline Candidate Management                 | Enable efficient tracking, updating, searching (with more filters), and importing/exporting of candidate profiles, including resume and avatar management. |
| Effective Position Management                   | Allow easy creation, modification, status tracking, and import/export of job openings, with custom field support.                                   |
| Advanced User & Permission Management           | Support distinct roles, user groups with configurable permissions, and self-service password changes.                                                 |
| Centralized & Configurable Data                 | Provide a single source of truth for candidate and position information, with server-side app preferences and data model display settings.        |
| Improve Recruiter Productivity                  | Reduce manual effort in managing applicants and workflows, with features like a filterable task board and stage management.                         |
| Lay Foundation for AI & Automation              | Design the system to potentially integrate AI-powered features and allow configuration for webhook-based automation and notifications.                |
| Enhance System Administration                   | Provide tools for managing recruitment stages, custom fields, webhook mappings, notification settings, and viewing detailed application logs.         |

## 3. Business Needs

The current (hypothetical) recruitment process may suffer from inefficiencies due to scattered information, manual tracking, lack of a centralized system, and limited customization. This project addresses the need for:
*   A unified platform to manage all recruitment activities with greater control.
*   Improved visibility into the candidate pipeline for all stakeholders.
*   Faster processing of applications and candidate progression.
*   Better organization of candidate data, including resumes, avatars, custom fields, and interaction history.
*   Enhanced collaboration between recruiters and hiring managers.
*   A secure system for handling sensitive candidate information, with granular access controls.
*   A configurable system that can adapt to specific recruitment workflows (e.g., custom stages, fields, notification preferences).
*   Auditability of system actions and user activities.

## 4. Scope

### In-Scope:

| Area                                     | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Authentication**                  | Secure login via Azure AD SSO and Credentials (email/password). User self-service password change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Dashboard**                            | Overview of key recruitment metrics.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Candidate Management**                 | Creation, viewing, editing, and deletion of candidate profiles. Resume upload and storage (MinIO) with **resume history tracking**. **Candidate profile image upload**. Tracking of candidate status through customizable recruitment stages. Transition history logging with notes. Assignment of candidates to recruiters. **Enhanced filtering (name, position, status, education, fit score)**. Custom fields. **Bulk import/export (CSV)**.                                                                                                                                           |
| **Position Management**                  | Creation, viewing, editing, and deletion of job positions. Management of position details (title, department, description, status, level). Custom fields. **Enhanced filtering (title, department, status, level)**. **Bulk import/export (CSV)**.                                                                                                                                                                                                                                                                                                                                    |
| **User Management**                      | Creation, viewing, editing, and deletion of user accounts. Assignment of user roles (Admin, Recruiter, Hiring Manager). Management of module-level permissions (including **import/export permissions**). **User group management with permission assignment to groups**. Admin reset of user passwords.                                                                                                                                                                                                                                                                        |
| **My Task Board**                        | View for recruiters/admins to see their assigned candidates, with **enhanced filtering capabilities similar to the main candidate list**.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Application Logging**                  | Audit trail for key system and user actions, with **filtering and search capabilities**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **API Documentation Page**               | Overview of available API endpoints.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Settings**                             | **Server-side general preferences** (Theme preference, App Name, App Logo). **Server-side data model UI preferences** per user. Server-side configurations for recruitment stages (including **deletion with replacement**), custom fields, and webhook payload mapping. SMTP and automation webhook integration points. **Notification Settings Configuration** (UI to define events and channels like email/webhook, with URL for webhooks; actual triggering is future). |

### Out-of-Scope (for this prototype phase):

| Out-of-Scope Item                                                                                                   |
| :------------------------------------------------------------------------------------------------------------------ |
| Advanced AI-powered resume parsing and candidate-to-job matching (Genkit integration is conceptual).                  |
| Real-time notifications and collaboration features (Redis integration is conceptual).                                 |
| **Actual triggering and sending of notifications** (email/webhook) based on configured settings.                      |
| Direct third-party job board integrations (posting, applicant import beyond current CSV/automation conceptual flow).         |
| Advanced analytics and reporting beyond basic dashboard views.                                                        |
| Automated email communication workflows (beyond conceptual SMTP setup).                                               |
| Comprehensive performance testing and optimization for very large datasets.                                         |
| Public-facing career portal for candidates to apply directly.                                                         |
| Drag-and-drop sorting for UI elements like recruitment stages.                                                        |
| Full dynamic inheritance of user group permissions into active user sessions (backend for assignment exists, enforcement is conceptual). |

## 5. Stakeholders

| Stakeholder Role        | Primary Interest/Responsibility                                                                     |
| :---------------------- | :-------------------------------------------------------------------------------------------------- |
| Recruiters              | Primary users for managing candidates and positions, tracking applications, utilizing task board.   |
| Hiring Managers         | Users involved in reviewing candidates and making hiring decisions.                               |
| System Administrators   | Users responsible for managing users, system settings (stages, fields, notifications), and integrity.|
| (Future) Candidates     | Indirectly affected by the efficiency and usability of the system.                                  |

## 6. Business Requirements

### Functional Requirements:

| ID    | Requirement Description                                                                                                          |
| :---- | :------------------------------------------------------------------------------------------------------------------------------- |
| FR1.1 | The system must allow users to register (if applicable) and log in using email/password.                                         |
| FR1.2 | The system must support Single Sign-On (SSO) via Azure Active Directory.                                                           |
| FR1.3 | The system must enforce role-based and permission-based access control (RBAC) for different functionalities.                   |
| FR1.4 | Users must be able to change their own passwords.                                                                                  |
| FR2.1 | Authorized users must be able to create, view, edit, and delete candidate profiles.                                              |
| FR2.2 | The system must allow uploading and storing candidate resumes, and maintain a history of uploaded resumes.                       |
| FR2.3 | The system must allow uploading and storing candidate profile images.                                                            |
| FR2.4 | The system must track the status of candidates through a customizable recruitment pipeline.                                        |
| FR2.5 | The system must log changes in candidate status and allow adding/editing notes to these transitions.                               |
| FR2.6 | The system must allow **enhanced filtering** for candidates (e.g., by name, position, status, education, fit score).             |
| FR2.7 | The system must support **bulk import and export of candidate data** (e.g., via CSV).                                            |
| FR3.1 | Authorized users must be able to create, view, edit, and delete job positions.                                                   |
| FR3.2 | The system must store details for each position, including title, department, description, status, and level.                    |
| FR3.3 | The system must allow **enhanced filtering** for positions (e.g., by title, department, status, level).                          |
| FR3.4 | The system must support **bulk import and export of position data** (e.g., via CSV).                                             |
| FR4.1 | Administrators must be able to create, view, edit, and delete user accounts.                                                     |
| FR4.2 | Administrators must be able to assign roles and **granular module permissions** (e.g., import/export) to users.                  |
| FR4.3 | Administrators must be able to create and manage **user groups, and assign permissions to these groups**.                          |
| FR5.1 | The system must log key user actions and system events for auditing purposes, with **filtering and search capabilities**.        |
| FR6.1 | The system must provide a **My Task Board** with **enhanced filtering** for assigned candidates.                                   |
| FR7.1 | The system must allow administrators to manage application **preferences (App Name, Logo) on the server**.                         |
| FR7.2 | The system must allow administrators to manage **recruitment stages**, including deletion with a replacement strategy.             |
| FR7.3 | The system must allow administrators to define **custom fields** for candidates and positions.                                     |
| FR7.4 | The system must allow administrators to configure **webhook payload mappings**.                                                  |
| FR7.5 | The system must allow administrators to configure **notification settings** (events, channels, webhook URLs).                    |
| FR7.6 | Users must be able to set their **UI display preferences for data models**, stored on the server.                                |

### Non-Functional Requirements:

| ID     | Requirement Description                                                                                             |
| :----- | :------------------------------------------------------------------------------------------------------------------ |
| NFR1   | **Performance:** The system should respond to user actions within acceptable timeframes (e.g., page loads within 3-5 seconds for typical operations). |
| NFR2.1 | **Security:** User passwords must be securely hashed (e.g., using bcrypt).                                          |
| NFR2.2 | **Security:** Access to system functionalities must be restricted based on user roles and permissions.              |
| NFR2.3 | **Security:** Sensitive data (e.g., candidate PII) should be handled appropriately.                                 |
| NFR3   | **Usability:** The user interface should be intuitive and easy to navigate for all user roles.                        |
| NFR4   | **Reliability:** The system should be available and function correctly during expected usage hours.                 |
| NFR5   | **Maintainability:** The codebase should be well-organized and documented to facilitate future updates.           |
| NFR6   | **Scalability:** The system architecture should allow for future scaling (within prototype limits).                 |
| NFR7   | **Configurability:** Key aspects of the system (stages, custom fields, notifications) should be configurable by admins. |

## 7. Success Criteria

| Criterion                                                                                                              |
| :--------------------------------------------------------------------------------------------------------------------- |
| Successful creation, management, and tracking of at least 50 mock candidates through various pipeline stages.          |
| Successful creation and management of at least 10 mock job positions.                                                  |
| Demonstration of user login (credentials & SSO) and role/permission-based access for Admin, Recruiter, Hiring Manager. |
| Successful resume and profile image upload and retrieval for mock candidates.                                          |
| Audit logs are generated for key CRUD operations and user authentication events, and are searchable.                   |
| Admins can successfully configure recruitment stages (including deletion with replacement), custom fields, user groups, and basic notification preferences. |
| Server-side application preferences (name, logo) are configurable and reflected.                                         |
| User-specific data model UI preferences are configurable and stored.                                                     |
| Enhanced filters on candidate, position, and task board pages function correctly.                                        |
| Positive feedback from internal review on usability and core functionality.                                            |

## 8. Assumptions

| Assumption                                                                                            |
| :---------------------------------------------------------------------------------------------------- |
| The chosen technology stack (Next.js, PostgreSQL, MinIO, Docker) is suitable for the project's objectives. |
| Docker and Docker Compose will be used for local development and deployment environments.             |
| Necessary environment variables for external services (Azure AD, automation webhooks) will be provided.        |
| Standard web browsers will be used to access the application.                                         |
| Initial database schema (`init-db.sql`) will be correctly applied during setup.                         |

## 9. Constraints

| Constraint                                                                                                 |
| :--------------------------------------------------------------------------------------------------------- |
| The project is developed as a prototype; some production-grade features (e.g., actual notification sending) are out of scope for initial phase. |
| Development relies on the capabilities of the specified tech stack.                                      |
| Time and resources are limited as per a typical prototype development cycle.                               |
| Rich UI interactions like drag-and-drop are not implemented in this phase.                                 |

## 10. Risks

| Risk                                      | Likelihood | Impact | Mitigation Strategy                                                                                                                                  |
| :---------------------------------------- | :--------- | :----- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data Migration (Future)                   | Low        | High   | If migrating from an existing system, data mapping and transfer could be complex. (Low risk for prototype)                                             |
| User Adoption (Future)                    | Low        | High   | Ensuring users are trained and adopt the new system effectively. (Low risk for prototype)                                                              |
| Scope Creep                               | Medium     | Medium | Adding features beyond the defined scope for the prototype phase could impact timelines. Rigorous adherence to scope and BRD.                          |
| Technical Debt                            | Medium     | Medium | Rapid prototyping might introduce technical debt. Plan for refactoring if system moves to production.                                                |
| Environment Configuration Issues          | Medium     | High   | Incorrect setup of environment variables or Docker configurations can hinder development and deployment. Thorough documentation and testing of setup.  |
| Complexity of Permission Model            | Medium     | Medium | Ensuring the user group and individual permission model is correctly implemented and enforced. Thorough testing of access control.                     |
| Data Integrity on Stage Deletion          | Low        | Medium | Ensure replacement logic for deleting stages in use correctly migrates data.                                                                         |

## 11. Appendices

*   (Placeholder) Appendix A: Data Model Overview (Key entities and relationships - see `init-db.sql` for schema)
*   (Placeholder) Appendix B: UI Mockups (If available - N/A for this AI-generated phase)
```