# API Documentation Overview

**Project:** HRI Enterprise
**Version:** 2.2
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

---

## 1. Introduction
The HRI API is a RESTful service built on Next.js API Routes. It powers the frontend client and provides integration points for external services (N8N, Webhooks).

## 2. Base URL
*   **Development**: `http://localhost:3000/api`
*   **Production**: `https://[domain]/api`

## 3. Authentication
All API endpoints (except `/auth/*` and public webhooks) require authentication.
*   **Method**: Session Cookie (NextAuth.js).
*   **Headers**: 
    *   `Content-Type: application/json`

## 4. Key Resources

### 4.1 applicants
*   `GET /v1/applicants`: List all applicants with pagination and filtering.
*   `GET /v1/applicants/[id]`: Retrieve detailed profile.
*   `POST /v1/applicants`: Create a new applicant (manually).
*   `PATCH /v1/applicants/[id]`: Update profile fields.
*   `DELETE /v1/applicants/[id]`: Soft delete applicant.

### 4.2 Positions
*   `GET /v1/positions`: List all job requisitions.
*   `POST /v1/positions`: Create a new position.
*   `GET /v1/positions/[id]/interviewers`: Get assigned interviewers.

### 4.3 Evaluations
*   `GET /v1/applicants/[id]/evaluations`: List past evaluations.
*   `POST /v1/evaluations`: Submit a new evaluation scorecard.

### 4.4 Settings
*   `GET /settings/system-settings`: Retrieve public config (e.g., logo, auth modes).
*   `GET /settings/custom-fields`: List defined custom fields schema.

## 5. Webhooks
HRI can emit events to external URLs for automation.
*   **Events**: `applicant.created`, `stage.changed`, `score.updated`.
*   **Configuration**: Managed via `/api/settings/webhooks`.

## 6. Real-time (SSE)
*   **Endpoint**: `/api/sse`
*   **Channels**:
    *   `evaluation-updates`: Live score sync.
    *   `upload-queue`: Background processing status.

## 7. Error Handling
Standard HTTP status codes are used:
*   `200 OK`: Success.
*   `400 Bad Request`: Validation error.
*   `401 Unauthorized`: Not logged in.
*   `403 Forbidden`: Insufficient permissions (RBAC).
*   `500 Internal Server Error`: Unexpected failure.

Response Body for Errors:
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```
