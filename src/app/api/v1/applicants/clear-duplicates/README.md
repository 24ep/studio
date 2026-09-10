# Clear Duplicate applicants API

This endpoint allows you to clear duplicate applicants based on email and position applied, keeping only the first applicant with a non-zero match score.

## Endpoint

```
POST /api/v1/applicants/clear-duplicates
```

## Authentication

Requires a valid API token in the Authorization header:
```
Authorization: Bearer <your-api-token>
```

## Permissions

The user must have the `applicants` module permission.

## Request Body

```json
{
  "dryRun": false,
  "positionId": "optional-position-uuid"
}
```

### Parameters

- `dryRun` (boolean, optional): If `true`, the API will only show what would be deleted without actually deleting anything. Default: `false`
- `positionId` (string, optional): If provided, only check for duplicates within this specific position. If `null` or not provided, check all positions.

## Response

### Success Response (200)

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

### Dry Run Response (200)

```json
{
  "success": true,
  "data": {
    "message": "Dry run completed - no changes made",
    "duplicatesFound": 3,
    "applicantsToDelete": 5,
    "keptapplicants": [...],
    "applicantsToDeleteDetails": [
      {
        "id": "uuid",
        "name": "John Doe",
        "email": "applicant@example.com",
        "positionId": "position-uuid",
        "fitScore": 0,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "dryRun": true
  }
}
```

### No Duplicates Found (200)

```json
{
  "success": true,
  "data": {
    "message": "No duplicate applicants found",
    "duplicatesFound": 0,
    "applicantsToDelete": 0,
    "dryRun": false
  }
}
```

## Logic

The API follows this logic to determine which applicant to keep:

1. **Groups applicants** by email and positionId combination
2. **Identifies duplicates** (groups with more than one applicant)
3. **Sorts applicants** in each duplicate group by creation date (earliest first)
4. **Keeps the first created applicant** (earliest createdAt date)
5. **Deletes all other applicants** in the duplicate group

## Example Usage

### Clear all duplicates (dry run first)
```bash
curl -X POST "https://your-domain.com/api/v1/applicants/clear-duplicates" \
  -H "Authorization: Bearer your-api-token" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

### Clear duplicates for a specific position
```bash
curl -X POST "https://your-domain.com/api/v1/applicants/clear-duplicates" \
  -H "Authorization: Bearer your-api-token" \
  -H "Content-Type: application/json" \
  -d '{"positionId": "123e4567-e89b-12d3-a456-426614174000"}'
```

### Clear all duplicates (actual deletion)
```bash
curl -X POST "https://your-domain.com/api/v1/applicants/clear-duplicates" \
  -H "Authorization: Bearer your-api-token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Error Responses

### Unauthorized (401)
```json
{
  "success": false,
  "error": "Invalid API token"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": "Insufficient permissions to manage applicants"
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "error": "Failed to clear duplicate applicants"
}
```

## Notes

- The operation is **irreversible** - deleted applicants cannot be recovered
- Always use `dryRun: true` first to see what would be deleted
- The API logs all deletion operations for audit purposes
- Email addresses are compared case-insensitively
- applicants without a position (positionId = null) are treated as a separate group
