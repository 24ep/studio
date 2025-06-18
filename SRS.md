
# Software Requirements Specification (SRS)
## Candidate Matching - Applicant Tracking System

**Version:** 1.0
**Date:** {{ CURRENT_DATE }}

## Table of Contents

1.  [Introduction](#1-introduction)
    1.1. [Purpose](#11-purpose)
    1.2. [Scope](#12-scope)
    1.3. [Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
    1.4. [References](#14-references)
    1.5. [Overview](#15-overview)
2.  [Overall Description](#2-overall-description)
    2.1. [Product Perspective](#21-product-perspective)
    2.2. [Product Functions](#22-product-functions)
    2.3. [User Characteristics](#23-user-characteristics)
    2.4. [Constraints](#24-constraints)
    2.5. [Assumptions and Dependencies](#25-assumptions-and-dependencies)
3.  [Specific Requirements](#3-specific-requirements)
    3.1. [Functional Requirements](#31-functional-requirements)
        3.1.1. [Authentication](#311-authentication)
        3.1.2. [Dashboard](#312-dashboard)
        3.1.3. [Candidate Management](#313-candidate-management)
        3.1.4. [Position Management](#314-position-management)
        3.1.5. [User Management](#315-user-management)
        3.1.6. [My Task Board](#316-my-task-board)
        3.1.7. [Settings](#317-settings)
        3.1.8. [Logging](#318-logging)
        3.1.9. [API](#319-api)
    3.2. [User Interface (UI) Requirements](#32-user-interface-ui-requirements)
    3.3. [External Interface Requirements](#33-external-interface-requirements)
    3.4. [Non-Functional Requirements](#34-non-functional-requirements)
        3.4.1. [Performance](#341-performance)
        3.4.2. [Security](#342-security)
        3.4.3. [Reliability](#343-reliability)
        3.4.4. [Usability](#344-usability)
        3.4.5. [Maintainability](#345-maintainability)
4.  [Data Requirements](#4-data-requirements)
    4.1. [Database Schema Overview](#41-database-schema-overview)
5.  [Deployment Requirements](#5-deployment-requirements)
6.  [Future Considerations](#6-future-considerations)

---

## 1. Introduction

### 1.1. Purpose

This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for the Candidate Matching Applicant Tracking System (ATS). It serves as a guide for the development, testing, and deployment of the system, reflecting its current enhanced capabilities.

### 1.2. Scope

The Candidate Matching ATS is a web-based application designed to manage the recruitment lifecycle. This includes:

| Area                                      | Description                                                                                      |
| :---------------------------------------- | :----------------------------------------------------------------------------------------------- |
| Candidate Profile Management              | Managing candidate profiles, applications, resumes (with history), and profile images.           |
| Job Position Management                   | Creating and tracking job positions.                                                             |
| User Account Management                   | Managing user accounts, roles, user groups, and granular permissions.                            |
| Dashboard & Metrics                       | Providing a dashboard for key recruitment metrics.                                               |
| Settings & Configuration                  | Managing system preferences, recruitment stages, custom fields, notification settings, etc.      |
| Logging                                   | Logging system and user activities with search and filter capabilities.                          |
| API                                       | Offering an API for potential integrations.                                                      |

Features currently out of scope for the prototype include advanced AI matching, actual sending of notifications, direct job board posting, and a public-facing candidate portal.

### 1.3. Definitions, Acronyms, and Abbreviations

*   **ATS:** Applicant Tracking System
*   **RBAC:** Role-Based Access Control
*   **SSO:** Single Sign-On
*   **UI:** User Interface
*   **API:** Application Programming Interface
*   **CRUD:** Create, Read, Update, Delete
*   **PII:** Personally Identifiable Information
*   **MinIO:** High-performance, S3 compatible object storage
*   **PostgreSQL:** Open-source relational database
*   **NextAuth.js:** Authentication library for Next.js
*   **ShadCN UI:** UI component library
*   **Tailwind CSS:** CSS framework
*   **n8n:** Workflow automation tool
*   **Genkit:** AI framework (conceptual for this phase)
*   **CSV:** Comma-Separated Values

### 1.4. References

*   Business Requirements Document (BRD) - Candidate Matching ATS
*   Project README.md
*   ShadCN UI Documentation
*   Next.js Documentation
*   NextAuth.js Documentation

### 1.5. Overview

This document details the system's capabilities, constraints, and interfaces. Section 2 provides an overall description. Section 3 lists specific functional, UI, and non-functional requirements. Section 4 outlines data requirements. Section 5 covers deployment, and Section 6 discusses future considerations.

## 2. Overall Description

### 2.1. Product Perspective

The Candidate Matching ATS is a self-contained web application. It interacts with a PostgreSQL database for data persistence and a MinIO server for file storage (e.g., resumes, candidate avatars). It can optionally integrate with Azure AD for SSO and n8n for workflow automation via webhooks. It features server-side configuration for several aspects of its operation.

### 2.2. Product Functions

| Function                                                                                                |
| :------------------------------------------------------------------------------------------------------ |
| Secure user authentication (credentials, Azure AD SSO) and authorization (roles, permissions, groups).  |
| User self-service password changes.                                                                     |
| Creation and management of candidate profiles, including resume uploads (with history) and profile images. |
| Creation and management of job positions, including custom fields.                                      |
| User account management with role, group, and granular permission assignments.                          |
| A dashboard providing an overview of recruitment activities.                                            |
| Logging of important system events and user actions, with search and filtering.                         |
| Server-side configuration options for application preferences (name, logo), recruitment stages (including deletion with replacement), custom fields, user UI data model preferences, webhook mappings, and notification settings. |
| An API for programmatic access to certain functionalities.                                              |
| Import and export capabilities for candidate and position data (CSV).                                   |
| Filterable task board for recruiters and admins.                                                        |

### 2.3. User Characteristics

| User Role               | Description/Responsibilities                                                                                                                     |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| System Administrator    | Technical user responsible for user management, system configuration (stages, fields, notifications, groups, permissions), logs, and system health. |
| Recruiter               | Primary user responsible for managing candidates, positions, tracking applications, utilizing "My Task Board".                                   |
| Hiring Manager          | User involved in reviewing assigned candidates and providing feedback (access typically more restricted based on permissions).                   |

### 2.4. Constraints

*   The system is built using Next.js, React, TypeScript, Tailwind CSS, and ShadCN UI.
*   Backend data is stored in a PostgreSQL database.
*   File storage is handled by a MinIO-compatible object storage service.
*   Authentication is managed by NextAuth.js.
*   The application is designed to be deployed using Docker and Docker Compose.
*   Actual sending of notifications (email/webhook) is not implemented in this phase, only configuration.
*   Rich UI interactions like drag-and-drop for sorting are not implemented.

### 2.5. Assumptions and Dependencies

*   Users will have access to a modern web browser.
*   The underlying infrastructure (servers, database, MinIO) is operational.
*   Environment variables are correctly configured for all services.
*   The default admin user (`admin@ncc.com` / `nccadmin`) will be changed or secured post-initialization.

## 3. Specific Requirements

### 3.1. Functional Requirements

#### 3.1.1. Authentication

| ID          | Requirement Description                                                                     |
| :---------- | :------------------------------------------------------------------------------------------ |
| FR-AUTH-001 | The system shall allow users to log in using their registered email and password.             |
| FR-AUTH-002 | The system shall securely hash and store user passwords using bcrypt.                       |
| FR-AUTH-003 | The system shall support Single Sign-On (SSO) via Azure Active Directory.                     |
| FR-AUTH-004 | The system shall redirect unauthenticated users to the sign-in page.                          |
| FR-AUTH-005 | The system shall allow authenticated users to log out.                                        |
| FR-AUTH-006 | The system shall allow authenticated users to change their own password.                      |
| FR-AUTH-007 | The system shall log successful and failed login attempts, and logout events.                 |

#### 3.1.2. Dashboard

| ID          | Requirement Description                                                                      |
| :---------- | :------------------------------------------------------------------------------------------- |
| FR-DASH-001 | The system shall display a dashboard with key recruitment metrics upon successful login.       |
| FR-DASH-002 | The dashboard shall include a chart showing the number of candidates per open position.        |
| FR-DASH-003 | The dashboard shall display summary statistics (e.g., total candidates, open positions, hires).|
| FR-DASH-004 | The dashboard shall list newly applied candidates today.                                       |
| FR-DASH-005 | The dashboard shall list open positions that currently have no candidates.                     |

#### 3.1.3. Candidate Management

| ID           | Requirement Description                                                                                                |
| :----------- | :--------------------------------------------------------------------------------------------------------------------- |
| FR-CAND-001  | Authorized users shall be able to create new candidate profiles manually.                                                |
| FR-CAND-002  | The system shall allow uploading candidate resumes (PDF, DOC, DOCX) to MinIO.                                            |
| FR-CAND-003  | The system shall maintain a history of uploaded resumes for each candidate.                                              |
| FR-CAND-004  | The system shall allow uploading and displaying a profile image for each candidate.                                      |
| FR-CAND-005  | The system shall provide an option to send uploaded resumes to a configurable n8n webhook for processing.                |
| FR-CAND-006  | The system shall allow authorized users to view a list of all candidates, with enhanced filtering options (name, position, status, education, fit score). |
| FR-CAND-007  | Authorized users shall be able to view detailed information for a specific candidate.                                    |
| FR-CAND-008  | Authorized users shall be able to edit candidate profile information, including parsed data fields.                      |
| FR-CAND-009  | Authorized users shall be able to update a candidate's status in the recruitment pipeline.                               |
| FR-CAND-010  | Each status change shall be logged as a transition record, with the option to add/edit notes.                            |
| FR-CAND-011  | Authorized users shall be able to delete transition records.                                                             |
| FR-CAND-012  | Authorized users shall be able to assign a candidate to a specific recruiter.                                            |
| FR-CAND-013  | Authorized users (Admin or with permission) shall be able to delete candidate profiles.                                  |
| FR-CAND-014  | The system shall support associating custom-defined fields with candidate profiles.                                      |
| FR-CAND-015  | The system shall provide an option to import candidates from a CSV file.                                                 |
| FR-CAND-016  | The system shall provide an option to export candidate data to a CSV file.                                               |
| FR-CAND-017  | The system shall allow uploading a PDF resume to an n8n webhook for automated new candidate creation.                    |

#### 3.1.4. Position Management

| ID          | Requirement Description                                                                                             |
| :---------- | :------------------------------------------------------------------------------------------------------------------ |
| FR-POS-001  | Authorized users shall be able to create new job positions.                                                         |
| FR-POS-002  | Position details shall include title, department, description, open/closed status, and position level.              |
| FR-POS-003  | Authorized users shall be able to view a list of all job positions, with enhanced filtering options (title, department, status, level). |
| FR-POS-004  | Authorized users shall be able to view detailed information for a specific position.                                |
| FR-POS-005  | Authorized users shall be able to edit job position details.                                                        |
| FR-POS-006  | Authorized users (Admin or with permission) shall be able to delete job positions (prevented if candidates are associated, unless replacement is handled). |
| FR-POS-007  | The system shall support associating custom-defined fields with position profiles.                                  |
| FR-POS-008  | The system shall provide an option to import positions from a CSV file.                                             |
| FR-POS-009  | The system shall provide an option to export position data to a CSV file.                                           |

#### 3.1.5. User Management

| ID          | Requirement Description                                                                                             |
| :---------- | :------------------------------------------------------------------------------------------------------------------ |
| FR-USER-001 | Administrators shall be able to create new user accounts.                                                             |
| FR-USER-002 | Administrators shall be able to view a list of all users, with filtering (name, email, role).                       |
| FR-USER-003 | Administrators shall be able to edit user details, including name, email, role, and reset password.                 |
| FR-USER-004 | Administrators shall be able to assign/revoke specific module permissions (e.g., import/export) to users.           |
| FR-USER-005 | Administrators shall be able to delete user accounts (except their own).                                              |
| FR-USER-006 | Administrators shall be able to create, view, edit, and delete user groups.                                         |
| FR-USER-007 | Administrators shall be able to assign users to one or more user groups.                                            |
| FR-USER-008 | Administrators shall be able to assign module permissions to user groups.                                           |

#### 3.1.6. My Task Board

| ID          | Requirement Description                                                                                             |
| :---------- | :------------------------------------------------------------------------------------------------------------------ |
| FR-TASK-001 | Recruiters and Administrators shall be able to view a "My Task Board" page.                                         |
| FR-TASK-002 | The task board shall display candidates assigned to the logged-in recruiter.                                        |
| FR-TASK-003 | Administrators shall be able to filter the task board to view candidates assigned to any recruiter or all candidates. |
| FR-TASK-004 | The task board shall offer both a list view and a Kanban view.                                                      |
| FR-TASK-005 | Users shall be able to filter candidates on the task board using enhanced filters similar to the main candidate list. |

#### 3.1.7. Settings

| ID               | Requirement Description                                                                                                             |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| FR-SET-001       | Administrators shall be able to manage server-side application preferences (theme preference, app name, app logo).                |
| FR-SET-002       | Administrators shall be able to manage system-wide recruitment stages, including deletion with candidate migration.                 |
| FR-SET-003       | Users (with permission) shall be able to view data model attributes and set server-side UI display preferences (per user).        |
| FR-SET-004       | Administrators shall be able to define custom data fields for Candidate and Position models.                                        |
| FR-SET-005       | Administrators shall be able to configure mappings for incoming webhook payloads.                                                     |
| FR-SET-006       | The system shall provide a UI to display information about server-configured webhook URLs and conceptual SMTP settings.             |
| FR-SET-007       | Administrators shall be able to configure notification settings, enabling/disabling specific events and channels (email, webhook), and setting webhook URLs. |

#### 3.1.8. Logging

| ID          | Requirement Description                                                                                             |
| :---------- | :------------------------------------------------------------------------------------------------------------------ |
| FR-LOG-001  | The system shall log key actions to a database table ("LogEntry").                                                    |
| FR-LOG-002  | Authorized users (Admin or specific permission) shall be able to view application logs.                               |
| FR-LOG-003  | Log entries shall include timestamp, level, message, source, acting user ID, and optional details.                  |
| FR-LOG-004  | The log viewing page shall support filtering by log level and searching by message/source, with pagination.           |

#### 3.1.9. API

| ID          | Requirement Description                                                                                             |
| :---------- | :------------------------------------------------------------------------------------------------------------------ |
| FR-API-001  | The system shall expose RESTful API endpoints for managing candidates (CRUD, resume upload, avatar upload).         |
| FR-API-002  | The system shall expose RESTful API endpoints for managing positions (CRUD).                                        |
| FR-API-003  | The system shall expose RESTful API endpoints for managing users (CRUD) - Admin restricted.                           |
| FR-API-004  | The system shall expose an API endpoint for receiving candidate data from external workflows (e.g., n8n).             |
| FR-API-005  | The system shall expose an API endpoint for logging.                                                                  |
| FR-API-006  | The system shall provide an API documentation page listing key public/semi-public endpoints.                        |
| FR-API-007  | The system shall expose API endpoints for managing system settings (preferences, stages, custom fields, webhook mappings, notification settings) - Admin restricted. |

### 3.2. User Interface (UI) Requirements

| ID     | Requirement Description                                                                                         |
| :----- | :-------------------------------------------------------------------------------------------------------------- |
| UI-001 | The UI shall be responsive and accessible on modern web browsers (desktop and tablet).                          |
| UI-002 | The UI shall utilize ShadCN UI components and Tailwind CSS for a consistent and modern look and feel.           |
| UI-003 | Navigation shall be intuitive, primarily through a collapsible sidebar.                                         |
| UI-004 | Forms shall provide clear labels, input validation messages, and appropriate input types.                       |
| UI-005 | Tables shall support sorting (where applicable) and display data clearly.                                       |
| UI-006 | Loading states shall be indicated to the user (e.g., spinners).                                                 |
| UI-007 | Error messages and success notifications shall be displayed to the user via toasts.                             |
| UI-008 | Key dropdowns (e.g., for status selection, some filters) shall support type-ahead search functionality.         |
| UI-009 | Data model preferences page shall use tabs for Candidate and Position models.                                   |

### 3.3. External Interface Requirements

| ID      | Interface              | Description                                                                                                                    |
| :------ | :--------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| EI-001  | Database (PostgreSQL)  | Interface with PostgreSQL for data persistence.                                                                                |
| EI-002  | File Storage (MinIO)   | Interface with MinIO (or S3-compatible) for storing resumes, candidate avatars, and other files.                               |
| EI-003  | Azure AD (Optional)    | Interface with Azure Active Directory for SSO if configured.                                                                   |
| EI-004  | n8n Webhooks (Optional)| Send/receive data to/from n8n workflows for automation.                                                                        |
| EI-005  | Google AI (Conceptual) | Future interface with Google AI services via Genkit.                                                                           |

### 3.4. Non-Functional Requirements

#### 3.4.1. Performance

| ID      | Requirement Description                                                                                        |
| :------ | :------------------------------------------------------------------------------------------------------------- |
| NFP-001 | Average page load times for common views should be under 3 seconds under typical load.                         |
| NFP-002 | API response times for common GET requests should be under 500ms.                                              |
| NFP-003 | Database queries should be optimized to avoid performance bottlenecks.                                         |

#### 3.4.2. Security

| ID      | Requirement Description                                                                                        |
| :------ | :------------------------------------------------------------------------------------------------------------- |
| NFS-001 | All user passwords stored in the database must be hashed using `bcrypt`.                                       |
| NFS-002 | Access to API endpoints and UI functionalities must be protected by authentication and RBAC (roles, permissions). |
| NFS-003 | The system shall use HTTPS for all communication in a production environment.                                  |
| NFS-004 | Input validation must be performed on both client-side and server-side.                                        |
| NFS-005 | `NEXTAUTH_SECRET` must be a strong, random string and kept confidential.                                       |

#### 3.4.3. Reliability

| ID      | Requirement Description                                                                                        |
| :------ | :------------------------------------------------------------------------------------------------------------- |
| NFR-001 | The system should aim for high availability, minimizing downtime.                                                |
| NFR-002 | Data integrity must be maintained; operations should be atomic where necessary.                                  |

#### 3.4.4. Usability

| ID      | Requirement Description                                                                                        |
| :------ | :------------------------------------------------------------------------------------------------------------- |
| NFU-001 | The system shall be intuitive for users with basic computer literacy.                                          |
| NFU-002 | Error messages shall be clear and guide the user on corrective actions.                                        |
| NFU-003 | The UI shall be consistent across different modules of the application.                                          |

#### 3.4.5. Maintainability

| ID      | Requirement Description                                                                                        |
| :------ | :------------------------------------------------------------------------------------------------------------- |
| NFM-001 | The codebase shall be modular and follow good coding practices.                                                |
| NFM-002 | TypeScript shall be used for strong typing to improve code quality.                                            |
| NFM-003 | Configuration shall be externalized using environment variables.                                               |

## 4. Data Requirements

### 4.1. Database Schema Overview

Key tables include:

| Table Name                  | Description                                                                                                |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------- |
| User                        | Stores user information (id, name, email, password, role, modulePermissions, avatarUrl, etc.).              |
| UserGroup                   | Stores user group information (id, name, description).                                                     |
| User_UserGroup              | Join table for User and UserGroup many-to-many relationship.                                               |
| UserGroup_PlatformModule    | Join table for UserGroup and PlatformModule (permissions) many-to-many relationship.                     |
| Position                    | Stores job position details (id, title, department, description, status, custom_attributes, etc.).         |
| Candidate                   | Stores candidate information (id, name, email, resumePath, avatarUrl, status, parsedData, custom_attributes, etc.). |
| ResumeHistory               | Stores history of resume uploads for candidates.                                                           |
| TransitionRecord            | Logs candidate status changes.                                                                             |
| RecruitmentStage            | Defines stages in the recruitment pipeline (system and custom).                                            |
| LogEntry                    | Stores application and audit logs.                                                                         |
| CustomFieldDefinition       | Defines custom fields for Candidate and Position models.                                                   |
| WebhookFieldMapping         | Stores mappings for incoming webhook payloads.                                                             |
| SystemSetting               | Stores system-wide preferences (e.g., appName, appLogoDataUrl).                                            |
| UserUIDisplayPreference     | Stores user-specific UI display preferences for data model attributes.                                     |
| NotificationEvent           | Defines system events that can trigger notifications.                                                      |
| NotificationChannel         | Defines notification channels (e.g., email, webhook).                                                      |
| NotificationSetting         | Links events to channels and stores their configuration (e.g., enabled, webhook URL).                      |

(Note: Detailed schema is in `pg-init-scripts/init-db.sql`)

## 5. Deployment Requirements

| ID      | Requirement Description                                                                                        |
| :------ | :------------------------------------------------------------------------------------------------------------- |
| DEP-001 | The application, PostgreSQL, and MinIO shall be deployable using Docker and Docker Compose.                    |
| DEP-002 | Configuration shall be managed via environment variables.                                                      |
| DEP-003 | The PostgreSQL database schema shall be initialized automatically via scripts.                                   |
| DEP-004 | The MinIO bucket shall be created automatically by the application if it doesn't exist.                        |

## 6. Future Considerations

| Consideration                                            |
| :------------------------------------------------------- |
| AI Integration (Genkit) for advanced matching and parsing. |
| Real-time Features (Redis) for notifications and collaboration. |
| **Implementation of actual notification sending logic.** |
| Advanced Reporting & Analytics.                          |
| Third-Party Integrations (Job boards, HRIS).             |
| Candidate Portal.                                        |
| Automated Email Workflows.                               |
| Full User Group Permission Inheritance enforcement.      |
| Rich UI for drag-and-drop sorting.                       |
```