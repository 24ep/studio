# API Specification (V1)

**Project:** HRI Enterprise
**Version:** 3.0
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

---

## 1. Overview
This document specifies the RESTful API endpoints for the HRI application. It details the request parameters, body schemas, response formats, and underlying business logic (including data extraction and database interactions).

**Base URL**: `/api/v1`
**Authentication**: Bearer Token (JWT) required via `Authorization` header.

## 2. Master Endpoint Map

| Domain | Method | Endpoint | Description | Request Type | Response Model |
|:---|:---|:---|:---|:---|:---|
| **Auth** | `POST` | `/auth/login` | Authenticate user & get token | JSON | `AuthResponse` |
| **Auth** | `GET` | `/auth/session` | Get current session info | None | `UserSession` |
| **Cand** | `GET` | `/applicants` | List applicants with filters | Query Params | `Paginated<applicant>` |
| **Cand** | `POST` | `/applicants` | Create manual applicant | JSON | `applicant` |
| **Cand** | `GET` | `/applicants/[id]` | Get detailed profile | Path Param | `applicantDetail` |
| **Cand** | `POST` | `/applicants/upload` | Upload & Parse Resume | Multipart/Form-Data | `UploadResult` |
| **Pos** | `GET` | `/positions` | List job requisitions | Query Params | `Paginated<Position>` |
| **Pos** | `POST` | `/positions` | Create new position | JSON | `Position` |
| **Pos** | `POST` | `/positions/[id]/headcount` | Add headcount slot | JSON | `Headcount` |
| **Eval** | `GET` | `/applicants/[id]/evaluations` | Get past evaluations | Path Param | `EvaluationHistory` |
| **Eval** | `POST` | `/evaluations` | Submit interview scorecard | JSON | `EvaluationResult` |
| **Task** | `GET` | `/tasks` | Get recruiter tasks | None | `TaskList` |
| **Set** | `GET` | `/settings/custom-fields` | Get query schema | None | `CustomFieldSchema` |

---

## 3. Detailed Endpoint Specifications

### 3.1 applicant Management

#### 3.1.1 List applicants
*   **Endpoint**: `GET /applicants`
*   **Logic**:
    1.  Parse query params: `page`, `limit`, `search` (name/email), `fitScoreMin`, `fitScoreMax`.
    2.  Build Prisma `where` clause.
    3.  Execute query with pagination.
*   **Input Parameters**:
    | Param | Type | Required | Description |
    |:---|:---|:---|:---|
    | `page` | Int | No | Page number (default 1) |
    | `search` | String | No | Partial match on Name or Email |
    | `fitScoreMin` | Int | No | Filter applicants with score >= X |
*   **Response (JSON)**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "name": "John Doe",
          "fitScore": 85.5,
          "position": { "title": "Dev" }
        }
      ],
      "meta": { "total": 100, "page": 1 }
    }
    ```

#### 3.1.2 Upload & Parse Resume (Extraction Logic)
*   **Endpoint**: `POST /applicants/upload`
*   **Logic (Extraction)**:
    1.  **Upload**: File is streamed to MinIO storage.
    2.  **Parsing**: File path sent to `PDFParser` service.
    3.  **Extraction**: Text content extracted and passed to **GenAI**.
    4.  **Structuring**: AI converts text to JSON (`ParsedData`: Skills, Education, Experience).
    5.  **Save**: New `applicant` record created with `parsedData`.
*   **Input Body**: `Multipart/Form-Data`
    | Field | Type | Description |
    |:---|:---|:---|
    | `file` | File | PDF or DOCX file |
    | `positionId` | UUID | Optional job to apply to |
*   **Database Interactions**:
    *   `INSERT INTO "Attachment"` (Resume file ref)
    *   `INSERT INTO "applicant"` (Profile data)
    *   `INSERT INTO "UploadQueue"` (Track processing status)

---

### 3.2 Position Management

#### 3.2.1 Create Position
*   **Endpoint**: `POST /positions`
*   **Input Body**:
    | Field | Type | Required | Description |
    |:---|:---|:---|:---|
    | `title` | String | Yes | Job Title |
    | `department` | String | Yes | Department |
    | `quota` | Int | No | Total headcount (default 1) |
*   **Database Interactions**:
    *   `INSERT INTO "Position"`
    *   `INSERT INTO "Headcount"` (Loop based on `quota`)

---

### 3.3 Evaluation System

#### 3.3.1 Submit Scorecard
*   **Endpoint**: `POST /evaluations`
*   **Logic**:
    1.  Validate user permissions (must be assigned interviewer or admin).
    2.  Iterate through `skills` array.
    3.  Calculate `overallScore` (average of skills/traits).
    4.  Broadcast `evaluation-update` via SSE to other viewers.
*   **Input Body**:
    ```json
    {
      "applicantId": "uuid",
      "positionId": "uuid",
      "skills": [
        { "skillId": "uuid", "score": 4, "note": "Good answers" }
      ],
      "comments": "Strong applicant"
    }
    ```
*   **Database Interactions**:
    *   `INSERT INTO "applicantEvaluation"`
    *   `INSERT INTO "applicantExpertiseScore"` (Batch)

---

## 4. Database Schema Reference (Prisma Models)

### 4.1 applicant
| Field | Type | Description |
|:---|:---|:---|
| `id` | UUID | PK |
| `fitScore` | Float | AI-calculated match verification |
| `parsedData` | Json | **Extraction Output**: `{ skills: [], education: [] }` |
| `customAttributes` | Json | Flexible schema for `CustomFieldDefinition` |

### 4.2 Position
| Field | Type | Description |
|:---|:---|:---|
| `id` | UUID | PK |
| `matchCriteria` | String | HTML/Text for AI matching logic |
| `interviewers` | Relation | M:N relation with `User` |

### 4.3 applicantEvaluation
| Field | Type | Description |
|:---|:---|:---|
| `overallScore` | Float | Aggregated score |
| `status` | String | `in_progress` \| `completed` |
