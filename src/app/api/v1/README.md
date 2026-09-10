# V1 API Documentation

This document provides comprehensive documentation for the V1 API endpoints.

## Authentication

All V1 API endpoints require JWT Bearer token authentication. First, authenticate using the login endpoint to receive a JWT token, then include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**Note:** The V1 API uses JWT-based authentication only. API keys are no longer supported. All authentication is handled through the `/api/v1/auth/login` endpoint.

## Base URL

All endpoints are prefixed with `/api/v1/`

## Automatic Fields

The following fields are automatically handled by the database and should not be included in request bodies:

- **`createdAt`**: Automatically set to the current timestamp when creating new records
- **`updatedAt`**: Automatically set to the current timestamp when updating records

These fields are returned in API responses but are managed by the database schema and Prisma ORM.

## Endpoints

### Authentication

#### POST `/api/v1/auth/login`
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "Admin",
    "modulePermissions": ["applicantS_VIEW", "applicantS_MANAGE"]
  }
}
```

### Health Check

#### GET `/api/v1/health`
Check the health status of the API and database.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "status": "connected",
    "currentTime": "2024-01-01 00:00:00"
  },
  "statistics": {
    "applicants": 150,
    "positions": 25,
    "users": 10
  },
  "version": "1.0.0",
  "api": "v1"
}
```

### Job Match Status

#### GET `/api/v1/job-match-status`
Check whether the job match function is enabled or disabled.

**Response:**
```json
{
  "success": true,
  "data": {
    "isJobMatchEnabled": true,
    "settingValue": "true",
    "defaultBehavior": "Feature is enabled by default unless explicitly set to 'false'"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/job-match-status",
  "method": "GET",
  "statusCode": 200
}
```

**Response when disabled:**
```json
{
  "success": true,
  "data": {
    "isJobMatchEnabled": false,
    "settingValue": "false",
    "defaultBehavior": "Feature is enabled by default unless explicitly set to 'false'"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/job-match-status",
  "method": "GET",
  "statusCode": 200
}
```

### applicants

#### GET `/api/v1/applicants`
Get a list of applicants with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search in name and email
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "applicant-id",
      "name": "Sample applicant",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "new",
      "positionId": "position-id",
      "recruiterId": "recruiter-id",
      "fitScore": 85,
      "customAttributes": {},
      "applicationDate": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "position": {
        "title": "Software Engineer",
        "department": "Engineering"
      },
      "recruiter": {
        "name": "Jane Smith"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

#### POST `/api/v1/applicants`
Create a new applicant with applicant information, job matches, and applied job data.

**Request Body:**
```json
{
  "applicant_info": {
    "personal_info": {
      "title_honorific": "Mr.",                     // Optional
      "firstname": "John",                          // Required
      "lastname": "Doe",                            // Required
      "nickname": "Johnny",                         // Optional
      "location": "Bangkok, Thailand",              // Optional
      "introduction_aboutme": "Experienced software engineer"  // Optional
    },
    "contact_info": {
      "email": "john@example.com",                  // Required
      "phone": "+1234567890"                        // Optional
    },
    "cv_language": "English",                       // Optional
    "education": [                                  // Optional
      {
        "major": "Computer Science",                // Optional
        "university": "University of Technology",   // Optional
        "period": "2018-2022"                       // Optional
      }
    ],
    "experience": [                                 // Optional
      {
        "company": "Tech Corp",                     // Optional
        "position": "Software Engineer",            // Optional
        "period": "2022-Present"                    // Optional
      }
    ],
    "skills": [                                     // Optional
      {
        "segment_skill": "Programming Languages",   // Optional
        "skill": ["JavaScript", "Python", "React"]  // Optional
      }
    ],
    "job_suitable": [                               // Optional
      {
        "suitable_career": "Software Engineer",     // Optional
        "suitable_job_level": "Mid-level"           // Optional
      }
    ],
    "status": "new"                                 // Optional (default: "new")
  }
  // Note: job_matches and job_applied fields have been removed from the v1 API schema
}
```

**Field Requirements:**

**Optional Fields (with defaults):**
- `applicant_info.personal_info.firstname` - applicant's first name (defaults to "Unknown applicant" if both firstname and lastname are empty)
- `applicant_info.personal_info.lastname` - applicant's last name (defaults to "Unknown applicant" if both firstname and lastname are empty)
- `applicant_info.contact_info.email` - applicant's email address (defaults to "unknown@email.com" if missing)

**Note:** The following fields have been removed from the v1 API and are no longer supported:
- `job_matches` - Job matching functionality has been moved to separate endpoints
- `job_applied` - Job application functionality has been moved to separate endpoints

**All Fields Are Optional:**
- All fields in the request body are optional with sensible defaults

**Note:** The following fields are automatically handled and should not be included in the request:
- `createdAt`: Automatically set to current timestamp
- `updatedAt`: Automatically set to current timestamp
- `applicationDate`: Automatically set to current timestamp
- `id`: Automatically generated UUID

**Response:**
```json
{
  "message": "applicant created successfully",
  "applicant": {
    "id": "applicant-uuid",
    "name": "Sample applicant",
    "email": "applicant@example.com",
    "phone": "+1234567890",
    "status": "new",
    "parsedData": { /* applicant_info only */ },
    "applicationDate": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/v1/applicants/import`
Import applicants from CSV or Excel files. Supports both file upload and JSON format.

**File Upload (multipart/form-data):**
```bash
curl -X POST /api/v1/applicants/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@applicants.csv"
```

**JSON Format:**
```json
{
  "applicants": [
    {
      "name": "Sample applicant",
      "email": "applicant@example.com",
      "phone": "+1234567890",
      "status": "Applied",
      "positionId": "position-uuid",
      "recruiterId": "recruiter-uuid",
      "fitScore": 85,
      "custom_attributes": {},
      "parsedData": null,
      "resumePath": null
    }
  ]
}
```

**CSV Format Example:**
```csv
name,email,phone,status,positionId,recruiterId,fitScore
Sample applicant,applicant@example.com,+1234567890,Applied,,,85
Jane Smith,jane.smith@example.com,+1234567891,Screening,,,90
```

**Response:**
```json
{
  "message": "Import completed",
  "results": {
    "imported": 2,
    "skipped": 1,
    "errors": ["applicant with email existing@example.com already exists"]
  }
}
```

#### GET `/api/v1/applicants/import`
Get import template for reference.

**Response:**
```json
{
  "applicants": [
    {
      "name": "Sample applicant",
      "email": "applicant@example.com",
      "phone": "+1234567890",
      "status": "Applied",
      "positionId": null,
      "recruiterId": null,
      "fitScore": 85,
      "custom_attributes": {},
      "parsedData": null,
      "resumePath": null
    }
  ]
}
```

#### GET `/api/v1/applicants/{id}`
Get a specific applicant by ID.

**Response:**
```json
{
  "id": "applicant-id",
  "name": "Sample applicant",
  "email": "john@example.com",
  "phone": "+1234567890",
  "status": "new",
  "positionId": "position-id",
  "recruiterId": "recruiter-id",
  "fitScore": 85,
  "customAttributes": {},
  "position": {
    "title": "Software Engineer",
    "department": "Engineering"
  },
  "recruiter": {
    "name": "Jane Smith"
  },
  "jobMatches": [],
  "resumeHistory": [] // Note: Now uses Attachment table
}
```

#### PUT `/api/v1/applicants/{id}`
Update a applicant. Only the fields you want to update need to be included in the request. Job matches and applied job data can also be updated through this endpoint.

**Example - Update only the status:**
```json
{
  "status": "Shortlisted"
}
```

**Example - Update basic information:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123"
}
```

**Example - Update applicant info structure:**
```json
{
  "applicant_info": {
    "personal_info": {
      "firstname": "John",
      "lastname": "Doe Updated"
    },
    "contact_info": {
      "email": "john.updated@example.com"
    }
  }
}
```

**Example - Update job matches:**
```json
{
  "job_matches": [
    {
      "fitScore": 0.85,
      "jobId": "position-uuid",
      "matchReasons": ["Strong technical skills", "Relevant experience"]
    }
  ]
}
```

**Example - Update multiple fields:**
```json
{
  "name": "Sample applicant Updated",
  "status": "Interviewing",
  "positionId": "new-position-uuid",
  "fitScore": 0.92
}
```

**Example - Update recruiter assignment:**
```json
{
  "recruiterId": "new-recruiter-uuid"
}
```

**Note:** You can also use the dedicated recruiter assignment endpoints (`/api/v1/applicants/{id}/recruiter`) for more specific recruiter management operations.

**Response:**
```json
{
  "message": "applicant updated successfully",
  "applicant": {
    "id": "applicant-uuid",
    "name": "Sample applicant Updated",
    "email": "applicant.updated@example.com",
    "status": "new",
    "parsedData": { /* updated data */ },
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "updated_fields": ["applicant_info"]
}
```

#### DELETE `/api/v1/applicants/{id}`
Delete a applicant.

#### POST `/api/v1/applicants/clear-duplicates`
Clear duplicate applicants based on email and position applied, keeping only the first applicant with a non-zero match score.

**Request Body:**
```json
{
  "dryRun": false,
  "positionId": "optional-position-uuid"
}
```

**Parameters:**
- `dryRun` (boolean, optional): If `true`, shows what would be deleted without actually deleting. Default: `false`
- `positionId` (string, optional): If provided, only check duplicates within this position. If `null`, check all positions.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully cleared 5 duplicate applicants",
    "duplicatesFound": 3,
    "applicantsDeleted": 5,
    "keptapplicants": [
      {
        "id": "uuid",
        "email": "applicant@example.com",
        "positionId": "position-uuid",
        "fitScore": 85.5,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "dryRun": false
  }
}
```

**Logic:** The API groups applicants by email and positionId, then keeps the first created applicant (earliest createdAt date).

### applicant Recruiter Assignment

#### GET `/api/v1/applicants/{id}/recruiter`
Get the current recruiter assignment for a applicant.

**Response:**
```json
{
  "applicantId": "applicant-id",
  "recruiter": {
    "id": "recruiter-id",
    "name": "Jane Smith",
    "email": "jane.smith@company.com"
  }
}
```

**Note:** The `recruiter` field will be `null` if no recruiter is assigned to the applicant.

#### PUT `/api/v1/applicants/{id}/recruiter`
Assign or update the recruiter for a applicant.

**Request Body:**
```json
{
  "recruiterId": "recruiter-uuid"
}
```

**Response:**
```json
{
  "message": "applicant recruiter updated successfully",
  "applicant": {
    "id": "applicant-id",
    "name": "Sample applicant",
    "recruiter": {
      "id": "recruiter-id",
      "name": "Jane Smith",
      "email": "jane.smith@company.com"
    }
  }
}
```

#### DELETE `/api/v1/applicants/{id}/recruiter`
Unassign the recruiter from a applicant.

**Response:**
```json
{
  "message": "applicant recruiter unassigned successfully"
}
```

### Job Applied Information

#### GET `/api/v1/applicants/{id}/job-applied`
Get applied job information for a applicant.

**Response:**
```json
{
  "job_applied": {
    "fitScore": 90,
    "jobId": "position-uuid",
    "justification": ["Strong technical background", "Relevant experience"]
  }
}
```

#### POST `/api/v1/applicants/{id}/job-applied`
Create or update applied job information for a applicant.

**Request Body:**
```json
{
  "fitScore": 90,
  "jobId": "position-uuid",
  "justification": ["Strong technical background", "Relevant experience"]
}
```

**Response:**
```json
{
  "message": "Job applied data updated successfully",
  "job_applied": {
    "fitScore": 90,
    "jobId": "position-uuid",
    "justification": ["Strong technical background", "Relevant experience"]
  }
}
```

#### PUT `/api/v1/applicants/{id}/job-applied`
Update applied job information for a applicant.

**Request Body:** Same as POST

**Response:** Same as POST

#### DELETE `/api/v1/applicants/{id}/job-applied`
Delete applied job information for a applicant.

### Job Matches

#### GET `/api/v1/applicants/{id}/job-matches`
Get all job matches for a applicant.

**Response:**
```json
{
  "job_matches": [
    {
      "id": "match-uuid",
      "fitScore": 85,
      "jobId": "position-uuid",
      "matchReasons": ["Strong technical skills", "Relevant experience"],
      "positionTitle": "Software Engineer",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/v1/applicants/{id}/job-matches`
Create or update job matches for a applicant.

**Request Body:**
```json
{
  "job_matches": [
    {
      "fitScore": 85,
      "jobId": "position-uuid",
      "matchReasons": ["Strong technical skills", "Relevant experience"]
    }
  ]
}
```

**Note:** The following fields are automatically handled and should not be included in the request:
- `positionTitle`: Automatically retrieved from the Position table based on `jobId`
- `createdAt`: Automatically set to current timestamp when creating new matches
- `updatedAt`: Automatically set to current timestamp when updating matches

**Response:**
```json
{
  "message": "Job matches updated successfully",
  "job_matches": [
    {
      "id": "match-uuid",
      "fitScore": 85,
      "jobId": "position-uuid",
      "matchReasons": ["Strong technical skills", "Relevant experience"]
    }
  ]
}
```

#### PUT `/api/v1/applicants/{id}/job-matches`
Update job matches for a applicant.

**Request Body:** Same as POST

**Response:** Same as POST

#### DELETE `/api/v1/applicants/{id}/job-matches`
Delete all job matches for a applicant.

### Individual Job Match

#### GET `/api/v1/applicants/{id}/job-matches/{matchId}`
Get a specific job match for a applicant.

**Response:**
```json
{
  "job_match": {
    "id": "match-uuid",
    "fitScore": 85,
    "jobId": "position-uuid",
    "matchReasons": ["Strong technical skills"],
    "positionTitle": "Software Engineer",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT `/api/v1/applicants/{id}/job-matches/{matchId}`
Update a specific job match for a applicant.

**Request Body:**
```json
{
  "fitScore": 90,
  "jobId": "position-uuid",
  "matchReasons": ["Updated match reasons"]
}
```

**Note:** The following fields are automatically handled and should not be included in the request:
- `positionTitle`: Automatically retrieved from the Position table based on `jobId`
- `createdAt`: Automatically set to current timestamp when creating new matches
- `updatedAt`: Automatically set to current timestamp when updating matches

**Response:**
```json
{
  "message": "Job match updated successfully",
  "job_match": {
    "id": "match-uuid",
    "fitScore": 90,
    "jobId": "position-uuid",
    "matchReasons": ["Updated match reasons"],
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### DELETE `/api/v1/applicants/{id}/job-matches/{matchId}`
Delete a specific job match for a applicant.

### Positions

#### GET `/api/v1/positions`
Get a list of positions with pagination and filtering.

**Query Parameters:**
- `title` (optional): Filter by title
- `department` (optional): Filter by department (comma-separated)
- `isOpen` (optional): Filter by open status
- `positionLevel` (optional): Filter by position level
- `limit` (optional): Items per page (default: 20)
- `offset` (optional): Offset for pagination

**Response:**
```json
{
  "data": [
    {
      "id": "position-id",
      "title": "Software Engineer",
      "department": "Engineering",
      "description": "Full-stack development role",
      "matchCriteria": "<h2>Compare applicant and Job</h2>...",
      "isOpen": true,
      "positionLevel": "Mid-level",
      "customAttributes": {},
      "recruiter": {
        "id": "recruiter-id",
        "name": "Jane Smith",
        "email": "jane.smith@company.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 25
}
```

#### POST `/api/v1/positions`
Create a new position.

**Request Body:**
```json
{
  "title": "Software Engineer",                     // Required
  "department": "Engineering",                      // Required
  "description": "Full-stack development role",     // Optional
  "matchCriteria": "",                              // Optional (default: system default)
  "isOpen": true,                                   // Optional (default: true)
  "positionLevel": "Mid-level",                    // Optional
  "customAttributes": {}                            // Optional (default: {})
}
```

**Field Requirements:**

**Required Fields:**
- `title` - Position title
- `department` - Department name

**Optional Fields:**
- `description` - Position description
- `matchCriteria` - Match criteria content (if empty, uses system default)
- `isOpen` - Whether position is open for applications (default: true)
- `positionLevel` - Position level (e.g., "Entry", "Mid-level", "Senior")
- `customAttributes` - Custom attributes object (default: {})

**Note:** The following fields are automatically handled and should not be included in the request:
- `createdAt`: Automatically set to current timestamp
- `updatedAt`: Automatically set to current timestamp
- `id`: Automatically generated UUID

#### GET `/api/v1/positions/{id}`
Get a specific position by ID.

**Response:**
```json
{
  "id": "position-id",
  "title": "Software Engineer",
  "department": "Engineering",
  "description": "Full-stack development role",
  "matchCriteria": "<h2>Compare applicant and Job</h2>...",
  "isOpen": true,
  "positionLevel": "Mid-level",
  "customAttributes": {},
  "recruiter": {
    "id": "recruiter-id",
    "name": "Jane Smith",
    "email": "jane.smith@company.com"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Note:** The `recruiter` field will be `null` if no recruiter is assigned to the position.

#### PUT `/api/v1/positions/{id}`
Update a position. Only the fields you want to update need to be included in the request.

**Note:** The following fields are automatically handled and should not be included in the request:
- `createdAt`: Automatically set to current timestamp
- `updatedAt`: Automatically set to current timestamp
- `id`: Automatically generated UUID

**Example - Update only the title:**
```json
{
  "title": "Updated Software Engineer Position"
}
```

**Example - Update multiple fields:**
```json
{
  "title": "Senior Software Engineer",
  "department": "Engineering",
  "isOpen": false
}
```

#### DELETE `/api/v1/positions/{id}`
Delete a position.

### Position Bulk Operations

#### POST `/api/v1/positions/bulk-action`
Perform bulk operations on positions.

**Request Body:**
```json
{
  "action": "update_status",
  "positionIds": ["id1", "id2", "id3"],
  "data": {
    "isOpen": false
  }
}
```

**Available Actions:**
- `delete`: Delete positions (only if no applicants assigned)
- `update_status`: Update open/closed status
- `update_department`: Update department

### Position Import/Export

#### GET `/api/v1/positions/export`
Export positions as CSV. The exported file includes recruiter information (name and email) for each position.

#### GET `/api/v1/positions/import`
Get import template.

#### POST `/api/v1/positions/import`
Import positions from JSON.

**Request Body:**
```json
{
  "positions": [
    {
      "title": "Software Engineer",                     // Required
      "department": "Engineering",                      // Required
      "description": "Full-stack development role",     // Optional
      "matchCriteria": "",                              // Optional (default: system default)
      "isOpen": true,                                   // Optional (default: true)
      "positionLevel": "Mid-level",                    // Optional
      "customAttributes": {}                            // Optional (default: {})
    }
  ]
}
```

**Field Requirements:**

**Required Fields:**
- `positions[].title` - Position title
- `positions[].department` - Department name

**Optional Fields:**
- `positions[].description` - Position description
- `positions[].matchCriteria` - Match criteria content (if empty, uses system default)
- `positions[].isOpen` - Whether position is open for applications (default: true)
- `positions[].positionLevel` - Position level (e.g., "Entry", "Mid-level", "Senior")
- `positions[].customAttributes` - Custom attributes object (default: {})

**Note:** The following fields are automatically handled and should not be included in the request:
- `createdAt`: Automatically set to current timestamp
- `updatedAt`: Automatically set to current timestamp
- `id`: Automatically generated UUID

### Users

#### GET `/api/v1/users`
Get a list of users with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role
- `searchTerm` (optional): Search in name and email

**Response:**
```json
{
  "users": [
    {
      "id": "user-id",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "Recruiter",
      "modulePermissions": ["applicantS_VIEW", "applicantS_MANAGE"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

#### POST `/api/v1/users`
Create a new user.

**Request Body:**
```json
{
  "name": "Jane Smith",                            // Required
  "email": "jane@example.com",                     // Required
  "role": "Recruiter",                             // Required
  "modulePermissions": ["applicantS_VIEW", "applicantS_MANAGE"],  // Optional (default: [])
  "password": "password123"                        // Optional (for basic auth)
}
```

**Field Requirements:**

**Required Fields:**
- `name` - User's full name
- `email` - User's email address (must be unique)
- `role` - User role ("Admin", "Recruiter", "User")

**Optional Fields:**
- `modulePermissions` - Array of module permissions (default: [])
- `password` - Password for basic authentication (optional if using external auth)

**Note:** The following fields are automatically handled and should not be included in the request:
- `createdAt`: Automatically set to current timestamp
- `updatedAt`: Automatically set to current timestamp
- `id`: Automatically generated UUID

#### GET `/api/v1/users/{id}`
Get a specific user by ID.

#### PUT `/api/v1/users/{id}`
Update a user.

#### DELETE `/api/v1/users/{id}`
Delete a user (only if no applicants assigned).

### applicant Avatar

#### POST `/api/v1/applicants/{id}/avatar`
Upload an avatar image for a applicant.

**Request Body (multipart/form-data):**
```bash
curl -X POST /api/v1/applicants/{id}/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@profile.jpg"
```

**Response:**
```json
{
  "message": "Avatar uploaded successfully",
  "avatar_url": "http://localhost:9000/uploads/avatars/applicant-id/uuid.jpg",
  "applicant": {
    "id": "applicant-uuid",
    "name": "Sample applicant",
    "avatarUrl": "http://localhost:9000/uploads/avatars/applicant-id/uuid.jpg"
  }
}
```

#### GET `/api/v1/applicants/{id}/avatar`
Get the avatar URL for a applicant.

**Response:**
```json
{
  "avatar_url": "http://localhost:9000/uploads/avatars/applicant-id/uuid.jpg"
}
```

### applicant Resumes

#### GET `/api/v1/applicants/{id}/resumes`
Get resumes for a applicant.

#### POST `/api/v1/applicants/{id}/resumes`
Upload a resume for a applicant.

#### PUT `/api/v1/applicants/{id}/resumes`
Update resume information.

#### DELETE `/api/v1/applicants/{id}/resumes`
Delete a resume.

### Recruitment Stages

#### GET `/api/v1/recruitment-stages`
Get all recruitment stages for filtering and display.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "stage-uuid",
      "name": "Applied",
      "description": "applicant has applied",
      "sort_order": 1,
      "color_complete": "#4CAF50",
      "color_badge": "#2E7D32",
      "is_system": true
    }
  ]
}
```

### AI Search

#### POST `/api/v1/ai/search-applicants`
Search applicants using AI-powered semantic search.

**Request Body:**
```json
{
  "query": "software engineer with React experience",
  "positionId": "position-uuid",
  "limit": 20,
  "offset": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "applicant-uuid",
      "name": "Sample applicant",
      "email": "applicant@example.com",
      "phone": "+1234567890",
      "status": "Applied",
      "fitScore": 85,
      "matchReasons": ["React experience", "Software engineering background"],
      "parsedData": {}
    }
  ],
  "total": 1,
  "query": "software engineer with React experience"
}
```

### Dashboard

#### GET `/api/v1/dashboard`
Get dashboard statistics and metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "applicants": {
      "total": 150,
      "new": 25,
      "inProgress": 45,
      "hired": 15,
      "rejected": 65
    },
    "positions": {
      "total": 25,
      "open": 18,
      "closed": 7
    },
    "applications": {
      "total": 300,
      "thisMonth": 45,
      "lastMonth": 38
    },
    "recruiters": {
      "total": 8,
      "active": 6
    },
    "recentActivity": [
      {
        "id": "activity-uuid",
        "type": "applicant_created",
        "message": "New applicant Sample applicant added",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "userId": "user-uuid",
        "userName": "Jane Smith"
      }
    ]
  }
}
```

### System Logs

#### GET `/api/v1/logs`
Get system logs with pagination and filtering. Requires Admin role or LOGS_VIEW permission.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `level` (optional): Filter by log level (info, warning, error)
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter until date (YYYY-MM-DD)
- `userId` (optional): Filter by user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "level": "info",
      "message": "User logged in successfully",
      "details": { "ip": "192.168.1.1" },
      "userId": "user-uuid",
      "userName": "Sample User",
      "actionType": "LOGIN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### applicant Transitions

#### GET `/api/v1/transitions`
Get applicant stage transitions with optional filtering.

**Query Parameters:**
- `applicantId` (optional): Filter by applicant ID
- `limit` (optional): Items per page (default: 20)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "transition-uuid",
      "applicantId": "applicant-uuid",
      "fromStageId": "stage-uuid-1",
      "toStageId": "stage-uuid-2",
      "fromStageName": "Applied",
      "toStageName": "Interview",
      "notes": "applicant passed initial screening",
      "transitionDate": "2024-01-01T00:00:00.000Z",
      "createdBy": "user-uuid",
      "createdByName": "Sample User",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### POST `/api/v1/transitions`
Create a new applicant stage transition.

**Request Body:**
```json
{
  "applicantId": "applicant-uuid",
  "fromStageId": "stage-uuid-1",
  "toStageId": "stage-uuid-2",
  "notes": "applicant passed initial screening",
  "transitionDate": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transition created successfully",
  "data": {
    "id": "transition-uuid",
    "applicantId": "applicant-uuid",
    "fromStageId": "stage-uuid-1",
    "toStageId": "stage-uuid-2",
    "notes": "applicant passed initial screening",
    "transitionDate": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### System Settings

#### GET `/api/v1/settings`
Get system settings and configuration. Requires Admin role.

**Response:**
```json
{
  "success": true,
  "data": {
    "systemSettings": {
      "defaultMatchCriteria": {
        "minScore": 70,
        "requiredSkills": ["JavaScript", "React"]
      },
      "emailSettings": {
        "smtpHost": "smtp.example.com",
        "smtpPort": 587
      },
      "fileUploadSettings": {
        "maxFileSize": 10485760,
        "allowedTypes": ["pdf", "doc", "docx"]
      }
    },
    "userPreferences": {
      "theme": "light",
      "language": "en",
      "timezone": "UTC"
    },
    "customFields": [
      {
        "id": "field-uuid",
        "name": "Preferred Location",
        "type": "select",
        "isRequired": false,
        "options": ["Remote", "On-site", "Hybrid"]
      }
    ]
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error
- `503`: Service Unavailable

## CORS Support

All endpoints support CORS and include appropriate headers for cross-origin requests.

## Rate Limiting

API endpoints may be subject to rate limiting. Check response headers for rate limit information.

## Versioning

This is the V1 API. Future versions will be available at `/api/v2/`, `/api/v3/`, etc.

## Permissions

The API uses role-based access control with the following roles:
- `Admin`: Full access to all endpoints
- `Recruiter`: Access to applicants and positions
- `User`: Limited access based on module permissions

Module permissions include:
- `applicantS_VIEW`: View applicants
- `applicantS_MANAGE`: Create, update, delete applicants
- `applicantS_EXPORT`: Export applicants
- `POSITIONS_VIEW`: View positions
- `POSITIONS_MANAGE`: Create, update, delete positions
- `POSITIONS_EXPORT`: Export positions
- `USERS_VIEW`: View users
- `USERS_MANAGE`: Create, update, delete users
- `LOGS_VIEW`: View system logs (Admin role also has access)

## API Documentation

Interactive API documentation is available at `/api-docs` which provides a Swagger UI interface for testing all endpoints.

## Payload Alignment

All API payloads are designed to align with the frontend components and database schema. The applicant creation and update endpoints support the structured format with `applicant_info` field. Job matches and applied job data are managed through separate dedicated endpoints.