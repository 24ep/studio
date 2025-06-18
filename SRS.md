
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

This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for the Candidate Matching Applicant Tracking System (ATS). It serves as a guide for the development, testing, and deployment of the system.

### 1.2. Scope

The Candidate Matching ATS is a web-based application designed to manage the recruitment lifecycle. This includes:
*   Managing candidate profiles, applications, and resumes.
*   Creating and tracking job positions.
*   Managing user accounts, roles, and permissions.
*   Providing a dashboard for key recruitment metrics.
*   Logging system and user activities.
*   Offering an API for potential integrations.

Features currently out of scope for the prototype include advanced AI matching, direct job board posting, and a public-facing candidate portal.

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

The Candidate Matching ATS is a self-contained web application. It interacts with a PostgreSQL database for data persistence and a MinIO server for file storage (e.g., resumes). It can optionally integrate with Azure AD for SSO and n8n for workflow automation via webhooks.

### 2.2. Product Functions

*   Secure user authentication and authorization.
*   Creation and management of candidate profiles, including resume uploads and status tracking.
*   Creation and management of job positions.
*   User account management with role and permission assignments.
*   A dashboard providing an overview of recruitment activities.
*   Logging of important system events and user actions.
*   Configuration options for recruitment stages, custom fields, and webhook mappings.
*   An API for programmatic access to certain functionalities.

### 2.3. User Characteristics

*   **System Administrator:** Technical user responsible for user management, system configuration, viewing logs, and overall system health. Possesses the highest level of access.
*   **Recruiter:** Primary user responsible for managing candidates, positions, tracking applications through the pipeline, and utilizing the "My Task Board".
*   **Hiring Manager:** User involved in reviewing assigned candidates and providing feedback (access to candidate details is typically more restricted than Recruiters).

### 2.4. Constraints

*   The system is built using Next.js, React, TypeScript, Tailwind CSS, and ShadCN UI.
*   Backend data is stored in a PostgreSQL database.
*   File storage is handled by a MinIO-compatible object storage service.
*   Authentication is managed by NextAuth.js.
*   The application is designed to be deployed using Docker and Docker Compose.

### 2.5. Assumptions and Dependencies

*   Users will have access to a modern web browser.
*   The underlying infrastructure (servers, database, MinIO) is operational.
*   Environment variables are correctly configured for all services (database, MinIO, NextAuth, Azure AD, n8n webhooks).
*   The default admin user (`admin@ncc.com` / `nccadmin`) will be changed or secured post-initialization.

## 3. Specific Requirements

### 3.1. Functional Requirements

#### 3.1.1. Authentication

*   **FR-AUTH-001:** The system shall allow users to log in using their registered email and password.
*   **FR-AUTH-002:** The system shall securely hash and store user passwords.
*   **FR-AUTH-003:** The system shall support Single Sign-On (SSO) via Azure Active Directory.
*   **FR-AUTH-004:** The system shall redirect unauthenticated users attempting to access protected pages to the sign-in page.
*   **FR-AUTH-005:** The system shall allow authenticated users to log out.
*   **FR-AUTH-006:** The system shall allow authenticated users to change their own password (for credentials-based accounts).
*   **FR-AUTH-007:** The system shall log successful and failed login attempts, and logout events.

#### 3.1.2. Dashboard

*   **FR-DASH-001:** The system shall display a dashboard with key recruitment metrics upon successful login.
*   **FR-DASH-002:** The dashboard shall include a chart showing the number of candidates per open position.
*   **FR-DASH-003:** The dashboard shall display summary statistics (e.g., total candidates, open positions, hires this month).
*   **FR-DASH-004:** The dashboard shall list newly applied candidates today.
*   **FR-DASH-005:** The dashboard shall list open positions that currently have no candidates.

#### 3.1.3. Candidate Management

*   **FR-CAND-001:** Authorized users (Admin, Recruiter) shall be able to create new candidate profiles manually.
*   **FR-CAND-002:** The system shall allow uploading candidate resumes (PDF, DOC, DOCX). Resumes shall be stored in MinIO.
*   **FR-CAND-003:** The system shall provide an option to send uploaded resumes to a configurable n8n webhook for automated processing.
*   **FR-CAND-004:** The system shall allow authorized users to view a list of all candidates, with filtering options (name, position, education, fit score).
*   **FR-CAND-005:** Authorized users shall be able to view detailed information for a specific candidate, including personal info, contact info, education, experience, skills, job suitability, applied position, fit score, status, and transition history.
*   **FR-CAND-006:** Authorized users shall be able to edit candidate profile information, including parsed resume data fields.
*   **FR-CAND-007:** Authorized users shall be able to update a candidate's status in the recruitment pipeline.
*   **FR-CAND-008:** Each status change shall be logged as a transition record, with the option to add notes.
*   **FR-CAND-009:** Authorized users shall be able to edit notes for existing transition records.
*   **FR-CAND-010:** Authorized users shall be able to delete transition records (with appropriate warnings).
*   **FR-CAND-011:** Authorized users shall be able to assign a candidate to a specific recruiter.
*   **FR-CAND-012:** Authorized users (Admin) shall be able to delete candidate profiles. Deleting a candidate also deletes associated transition records.
*   **FR-CAND-013:** The system shall support associating custom-defined fields with candidate profiles.
*   **FR-CAND-014:** The system shall provide an option to import candidates from an Excel/CSV file.
*   **FR-CAND-015:** The system shall provide an option to export candidate data to a CSV file.
*   **FR-CAND-016:** The system shall allow uploading a PDF resume to an n8n webhook for automated new candidate creation (workflow posts back to `/api/n8n/create-candidate-with-matches`).

#### 3.1.4. Position Management

*   **FR-POS-001:** Authorized users (Admin, Recruiter) shall be able to create new job positions.
*   **FR-POS-002:** Position details shall include title, department, description, open/closed status, and position level.
*   **FR-POS-003:** Authorized users shall be able to view a list of all job positions, with filtering options (title, department, status, level).
*   **FR-POS-004:** Authorized users shall be able to view detailed information for a specific position.
*   **FR-POS-005:** Authorized users shall be able to edit job position details.
*   **FR-POS-006:** Authorized users (Admin) shall be able to delete job positions. Deletion shall be prevented if candidates are associated with the position.
*   **FR-POS-007:** The system shall support associating custom-defined fields with position profiles.
*   **FR-POS-008:** The system shall provide an option to import positions from an Excel/CSV file.
*   **FR-POS-009:** The system shall provide an option to export position data to a CSV file.

#### 3.1.5. User Management

*   **FR-USER-001:** Administrators shall be able to create new user accounts with a name, email, password, and role.
*   **FR-USER-002:** Administrators shall be able to view a list of all users.
*   **FR-USER-003:** Administrators shall be able to edit user details, including name, email, role, and assign a new password.
*   **FR-USER-004:** Administrators shall be able to assign/revoke specific module permissions for users.
*   **FR-USER-005:** Administrators shall be able to delete user accounts (except their own).
*   **FR-USER-006:** Administrators shall be able to create, view, edit, and delete user groups.
*   **FR-USER-007:** Administrators shall be able to assign users to one or more user groups.

#### 3.1.6. My Task Board

*   **FR-TASK-001:** Recruiters and Administrators shall be able to view a "My Task Board" page.
*   **FR-TASK-002:** The task board shall display candidates assigned to the logged-in recruiter.
*   **FR-TASK-003:** Administrators shall be able to filter the task board to view candidates assigned to any recruiter or all candidates.
*   **FR-TASK-004:** The task board shall offer both a list view and a Kanban view (columns by candidate status).
*   **FR-TASK-005:** Users shall be able to filter candidates on the task board by status.

#### 3.1.7. Settings

*   **FR-SET-001:** Users shall be able to manage client-side preferences for application theme (light/dark/system), application name, and application logo. These settings are stored locally in the browser.
*   **FR-SET-002:** Administrators (or users with specific permission) shall be able to manage system-wide recruitment stages (add, edit name/description/order for custom stages). System-defined core stages shall be non-deletable and their names non-editable.
*   **FR-SET-003:** Administrators (or users with specific permission) shall be able to view data model attributes for Candidate and Position entities and set local UI display preferences (Standard, Emphasized, Hidden) and custom notes for these attributes. These preferences are stored locally.
*   **FR-SET-004:** Administrators (or users with specific permission) shall be able to define custom data fields (label, key, type, options for select, required status, order) for Candidate and Position models. These definitions are stored server-side.
*   **FR-SET-005:** Administrators (or users with specific permission) shall be able to configure mappings for incoming webhook payloads (e.g., from n8n) to target candidate attributes. These mappings are stored server-side.
*   **FR-SET-006 (Integrations):** The system shall provide a UI to display information about server-configured webhook URLs (n8n) and conceptual SMTP settings (client-side display only).

#### 3.1.8. Logging

*   **FR-LOG-001:** The system shall log key actions (CRUD operations on candidates, positions, users; authentication events; settings changes) to a database table ("LogEntry").
*   **FR-LOG-002:** Authorized users (Admin or specific permission) shall be able to view application logs through a dedicated UI page.
*   **FR-LOG-003:** Log entries shall include a timestamp, level (INFO, WARN, ERROR, AUDIT, DEBUG), message, source, acting user ID (if applicable), and optional details.
*   **FR-LOG-004:** The log viewing page shall support filtering by log level and pagination.

#### 3.1.9. API

*   **FR-API-001:** The system shall expose RESTful API endpoints for managing candidates (CRUD, resume upload).
*   **FR-API-002:** The system shall expose RESTful API endpoints for managing positions (CRUD).
*   **FR-API-003:** The system shall expose RESTful API endpoints for managing users (CRUD) - Admin restricted.
*   **FR-API-004:** The system shall expose an API endpoint for receiving candidate data from external workflows (e.g., n8n after resume parsing).
*   **FR-API-005:** The system shall expose an API endpoint for logging.
*   **FR-API-006:** The system shall provide an API documentation page listing key public/semi-public endpoints.

### 3.2. User Interface (UI) Requirements

*   **UI-001:** The UI shall be responsive and accessible on modern web browsers (desktop and tablet).
*   **UI-002:** The UI shall utilize ShadCN UI components and Tailwind CSS for a consistent and modern look and feel.
*   **UI-003:** Navigation shall be intuitive, primarily through a collapsible sidebar.
*   **UI-004:** Forms shall provide clear labels, input validation messages, and appropriate input types.
*   **UI-005:** Tables shall support sorting (where applicable) and display data clearly.
*   **UI-006:** Loading states shall be indicated to the user (e.g., spinners).
*   **UI-007:** Error messages and success notifications shall be displayed to the user via toasts.

### 3.3. External Interface Requirements

*   **EI-001 (Database):** The system shall interface with a PostgreSQL database for data persistence. All data related to candidates, positions, users, logs, settings, etc., will be stored here.
*   **EI-002 (File Storage):** The system shall interface with a MinIO (or S3-compatible) object storage service for storing candidate resumes and potentially other files.
*   **EI-003 (Azure AD - Optional):** The system shall be able to interface with Azure Active Directory for user authentication via OAuth if configured.
*   **EI-004 (n8n Webhooks - Optional):**
    *   The system can send resume data to a pre-configured n8n webhook URL for external processing (`N8N_RESUME_WEBHOOK_URL`).
    *   The system can send generic PDF data to a pre-configured n8n webhook URL for new candidate creation workflows (`N8N_GENERIC_PDF_WEBHOOK_URL`).
    *   The system provides an endpoint (`/api/n8n/create-candidate-with-matches`) to receive structured candidate data (presumably from an n8n workflow).
*   **EI-005 (Google AI - Conceptual):** For future AI features, the system may interface with Google AI services via Genkit.

### 3.4. Non-Functional Requirements

#### 3.4.1. Performance

*   **NFP-001:** Average page load times for common views (e.g., candidate list, position list) should be under 3 seconds under typical load (for prototype: single user, moderate data).
*   **NFP-002:** API response times for common GET requests should be under 500ms.
*   **NFP-003:** Database queries should be optimized to avoid performance bottlenecks.

#### 3.4.2. Security

*   **NFS-001:** All user passwords stored in the database must be hashed using `bcrypt`.
*   **NFS-002:** Access to API endpoints and UI functionalities must be protected by authentication and role-based authorization (RBAC).
*   **NFS-003:** The system shall use HTTPS for all communication in a production environment.
*   **NFS-004:** Input validation must be performed on both client-side and server-side to prevent common web vulnerabilities (e.g., XSS, SQL injection - though ORM/parameterized queries mitigate SQLi).
*   **NFS-005:** `NEXTAUTH_SECRET` must be a strong, random string and kept confidential.

#### 3.4.3. Reliability

*   **NFR-001:** The system should aim for high availability, minimizing downtime. (Specific % uptime TBD for production).
*   **NFR-002:** Data integrity must be maintained; operations should be atomic where necessary (e.g., using database transactions for multi-step updates).

#### 3.4.4. Usability

*   **NFU-001:** The system shall be intuitive for users with basic computer literacy.
*   **NFU-002:** Error messages shall be clear and guide the user on corrective actions.
*   **NFU-003:** The UI shall be consistent across different modules of the application.

#### 3.4.5. Maintainability

*   **NFM-001:** The codebase shall be modular and follow good coding practices.
*   **NFM-002:** TypeScript shall be used for strong typing to improve code quality and reduce runtime errors.
*   **NFM-003:** Configuration (e.g., database URLs, API keys) shall be externalized using environment variables.

## 4. Data Requirements

### 4.1. Database Schema Overview

The system will use a PostgreSQL database. Key tables include:

*   **User:** Stores user information (id, name, email, hashed_password, role, avatarUrl, modulePermissions, createdAt, updatedAt).
*   **UserGroup:** Stores user group information (id, name, description, createdAt, updatedAt).
*   **User_UserGroup:** Join table for many-to-many relationship between User and UserGroup (userId, groupId).
*   **Position:** Stores job position details (id, title, department, description, isOpen, position_level, custom_attributes, createdAt, updatedAt).
*   **Candidate:** Stores candidate information (id, name, email, phone, resumePath, parsedData (JSONB), positionId (FK to Position), fitScore, status, applicationDate, recruiterId (FK to User), custom_attributes, createdAt, updatedAt).
*   **TransitionRecord:** Logs candidate status changes (id, candidateId (FK to Candidate), date, stage, notes, actingUserId (FK to User), createdAt, updatedAt).
*   **RecruitmentStage:** Defines stages in the recruitment pipeline (id, name, description, is_system, sort_order, createdAt, updatedAt).
*   **LogEntry:** Stores application and audit logs (id, timestamp, level, message, source, actingUserId (FK to User), details (JSONB), createdAt).
*   **CustomFieldDefinition:** Defines custom fields for Candidate and Position models (id, model_name, field_key, label, field_type, options (JSONB), is_required, sort_order, createdAt, updatedAt).
*   **WebhookFieldMapping:** Stores mappings for incoming webhook payloads (id, target_path, source_path, notes, createdAt, updatedAt).

(Note: Foreign Key constraints, indexes, and detailed column types are defined in `pg-init-scripts/init-db.sql`)

## 5. Deployment Requirements

*   **DEP-001:** The application (Next.js frontend and backend), PostgreSQL database, and MinIO service shall be deployable using Docker and Docker Compose.
*   **DEP-002:** Configuration shall be managed via environment variables (passed to Docker containers or set in `.env.local`).
*   **DEP-003:** The PostgreSQL database schema shall be initialized automatically via scripts in `pg-init-scripts` when the database container starts with an empty volume.
*   **DEP-004:** The MinIO bucket shall be created automatically by the application if it doesn't exist.

## 6. Future Considerations

*   **AI Integration (Genkit):**
    *   Advanced resume parsing to automatically populate candidate profiles.
    *   AI-powered candidate-to-job matching and scoring.
    *   Generative AI for job description assistance or communication templates.
*   **Real-time Features (Redis):**
    *   Real-time notifications for status changes, new candidates, etc.
    *   Live updates on dashboards or task boards.
*   **Advanced Reporting & Analytics:** More detailed and customizable reports on recruitment KPIs.
*   **Third-Party Integrations:** Direct integration with job boards, HRIS systems.
*   **Candidate Portal:** A public-facing portal for candidates to search jobs and apply directly.
*   **Automated Email Workflows:** Sending automated emails to candidates at different stages.
*   **Full User Group Permission Model:** Implementing the assignment of module permissions based on User Group membership.
```