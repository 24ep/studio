# V1 Applicants API

This API provides endpoints for managing applicant information without job applications or job matches functionality.

## Base URL
```
/api/v1/applicants
```


## Authentication
All endpoints require authentication via NextAuth session.

## Automatic Fields

The following fields are automatically handled by the database and should not be included in request bodies:

- **`createdAt`**: Automatically set to the current timestamp when creating new records
- **`updatedAt`**: Automatically set to the current timestamp when updating records
- **`id`**: Automatically generated UUID
- **`applicationDate`**: Automatically set to the current timestamp when creating applicants

These fields are returned in API responses but are managed by the database schema and Prisma ORM.

## Automatic Recruiter Assignment

When creating or updating applicants through the v1 API, recruiters are automatically assigned based on the following rules:

- **New applicants**: If a applicant is created with a `positionId` and the position has a recruiter assigned, the applicant will automatically be assigned to that recruiter
- **Updated applicants**: If a applicant's position is changed and the new position has a recruiter, the applicant will be automatically assigned to that recruiter
- **Bulk Operations**: When using bulk position assignment, all affected applicants will be automatically assigned to the position's recruiter
- **Import Operations**: When importing applicants with a position but no recruiter, they will be automatically assigned to the position's recruiter

**Note**: Existing recruiter assignments are preserved and will not be overwritten by automatic assignment.

## Endpoints

### POST /api/v1/applicants
Create a new applicant with basic information.

#### Request Body
```json
{
  "firstName": "string (optional, defaults to 'Unknown applicant' if both firstname and lastname are empty)",
  "lastName": "string (optional, defaults to 'Unknown applicant' if both firstname and lastname are empty)", 
  "email": "string (optional, defaults to 'unknown@email.com' if missing)",
  "phone": "string (optional)",
  "location": "string (optional)",
  "experience": "string (optional)",
  "education": "string (optional)",
  "skills": "array (optional)",
  "summary": "string (optional)",
  "source": "string (optional, default: 'api')",
  "status": "string (optional, default: 'active')"
}
```

#### Example Request
```bash
curl -X POST /api/v1/applicants \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "location": "New York, NY",
    "experience": "5 years in software development",
    "education": "Bachelor's in Computer Science",
    "skills": ["JavaScript", "React", "Node.js"],
    "summary": "Experienced software developer with expertise in modern web technologies",
    "source": "api",
    "status": "active"
  }'
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "location": "New York, NY",
    "experience": "5 years in software development",
    "education": "Bachelor's in Computer Science",
    "skills": ["JavaScript", "React", "Node.js"],
    "summary": "Experienced software developer with expertise in modern web technologies",
    "source": "api",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "createdBy": {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "updatedBy": {
      "id": "uuid", 
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid input format
```json
{
  "error": "Invalid input format"
}
```

**Note**: All fields are now optional. If firstname and lastname are both empty, the applicant name will default to "Unknown applicant". If email is missing, it will default to "unknown@email.com".

**401 Unauthorized** - Invalid or missing authentication
```json
{
  "error": "Unauthorized"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

### GET /api/v1/applicants
Retrieve a list of applicants with pagination and filtering.

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `search` (optional): Search term for firstName, lastName, email, or location
- `status` (optional): Filter by applicant status

#### Example Request
```bash
curl -X GET "/api/v1/applicants?page=1&limit=10&search=john&status=active"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "location": "New York, NY",
      "experience": "5 years in software development",
      "education": "Bachelor's in Computer Science",
      "skills": ["JavaScript", "React", "Node.js"],
      "summary": "Experienced software developer with expertise in modern web technologies",
      "source": "api",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdBy": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

## Notes

- This API focuses only on applicant basic information
- Job applications and job matches are handled by separate APIs
- Email addresses are automatically converted to lowercase
- Duplicate email addresses are allowed for applicants
- All string fields are trimmed of whitespace
- The API uses Prisma for database operations
- Authentication is handled via NextAuth sessions 