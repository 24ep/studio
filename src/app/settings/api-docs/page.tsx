
// src/app/api-docs/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Code2, Terminal, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  requestBody: string;
  response: string;
  curlExample: string;
}

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/api/resumes/upload",
    description: "Upload a candidate resume. Requires candidateId as query param. Sends resume for automated processing if a resume webhook URL is set.",
    requestBody: "FormData: `resume`: File (PDF, DOC, DOCX)",
    response: "JSON: `{ message: &apos;Resume uploaded successfully&apos;, filePath: &apos;...&apos;, candidate: Candidate, n8nResponse?: {success: boolean, data?: any, error?: string} }` (n8nResponse field name is kept for API contract)",
    curlExample: `curl -X POST \\\n` +
                 `  -F \'resume=@resume.pdf\' \\\n` +
                 `  'http://localhost:9002/api/resumes/upload?candidateId=your-candidate-id'`,
  },
  {
    method: "GET",
    path: "/api/candidates",
    description: "Retrieve a list of candidates. Supports filtering by name, position, fit score, education.",
    requestBody: "N/A (Query params: `name`, `positionId`, `minFitScore`, `maxFitScore`, `education`, `email`, `phone`, `applicationDateStart`, `applicationDateEnd`, `recruiterId`, `keywords`)",
    response: "JSON: `Candidate[]` (Array of candidate objects)",
    curlExample: `curl 'http://localhost:9002/api/candidates?positionId=your-position-id'`,
  },
  {
    method: "POST",
    path: "/api/candidates",
    description: "Create a new candidate manually.",
    requestBody: "JSON: See `createCandidateSchema` in API route; `name`, `email`, `status` can be top-level. `parsedData` (CandidateDetails) holds detailed info. `positionId` (nullable).",
    response: "JSON: `Candidate` (Newly created candidate object)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{ \\\n` +
                 `    "name": "John Doe", \\\n` +
                 `    "email": "john@example.com", \\\n` +
                 `    "status": "Applied", \\\n` +
                 `    "parsedData": { \\\n` +
                 `      "personal_info": {"firstname": "John", "lastname": "Doe"}, \\\n` +
                 `      "contact_info": {"email": "john@example.com"} \\\n` +
                 `    }, \\\n` +
                 `    "positionId": null \\\n` +
                 `  }' \\\n` +
                 `  http://localhost:9002/api/candidates`,
  },
  {
    method: "POST",
    path: "/api/n8n/create-candidate-with-matches",
    description: "Webhook endpoint for an external system (e.g., an automation workflow) to create a candidate with job matching details. Expects a single candidate entry object in a specific nested structure.",
    requestBody: "JSON: `body[0].result_json[0].json = { candidate_info: CandidateDetails, jobs: N8NJobMatch[] }` (See `N8NCandidateWebhookEntry` type in `lib/types.ts`)",
    response: "JSON: `{ status: &apos;success&apos; | &apos;skipped&apos; | &apos;error&apos;, candidate?: Candidate, email?: string, message?: string, candidateId?: string }`",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '[{ \\\n` +
                 `    "result_json": [{ \\\n` +
                 `      "json": { \\\n` +
                 `        "candidate_info": { \\\n` +
                 `          "personal_info": { \"firstname\": \"Jane\", \"lastname\": \"Parsed\" }, \\\n` +
                 `          "contact_info": { \"email\": \"jane.parsed@example.com\" } \\\n` +
                 `        }, \\\n` +
                 `        "jobs": [ \\\n` +
                 `          { \"job_id\": \"MATCH_JOB_001\", \"job_title\": \"Software Engineer\", \"fit_score\": 90, \"match_reasons\": [\"Strong Python skill\"] } \\\n` +
                 `        ] \\\n` +
                 `      } \\\n` +
                 `    }] \\\n` +
                 `  }]' \\\n` +
                 `  http://localhost:9002/api/n8n/create-candidate-with-matches`,
  },
  {
    method: "GET",
    path: "/api/candidates/{id}",
    description: "Retrieve details for a specific candidate, including transition history.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `Candidate` (Single candidate object with transition history)",
    curlExample: `curl http://localhost:9002/api/candidates/your-candidate-id`,
  },
  {
    method: "PUT",
    path: "/api/candidates/{id}",
    description: "Update a candidate's information or status. Triggers transition record creation on status change.",
    requestBody: "JSON: `{ name?: string, status?: CandidateStatus, parsedData?: CandidateDetails, ... }` (See `updateCandidateSchema`)",
    response: "JSON: `Candidate` (Updated candidate object with transition history)",
    curlExample: `curl -X PUT \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{ \\\n` +
                 `    "status": "Interviewing" \\\n` +
                 `  }' \\\n` +
                 `  http://localhost:9002/api/candidates/your-candidate-id`,
  },
  {
    method: "DELETE",
    path: "/api/candidates/{id}",
    description: "Delete a candidate. Also deletes associated transition records.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: &apos;Candidate deleted successfully&apos; }`",
    curlExample: `curl -X DELETE http://localhost:9002/api/candidates/your-candidate-id`,
  },
  {
    method: "POST",
    path: "/api/candidates/upload-for-n8n",
    description: "Upload a PDF resume to be sent to an automated workflow for new candidate creation (workflow uses /api/n8n/create-candidate-with-matches to post back). Requires a Generic PDF Webhook URL set on server.",
    requestBody: "FormData: `pdfFile`: File (PDF), `positionId` (optional), `targetPositionDescription` (optional), `targetPositionLevel` (optional)",
    response: "JSON: `{ message: &apos;PDF successfully sent to workflow for candidate creation.&apos;, n8nResponse?: any }`",
    curlExample: `curl -X POST \\\n` +
                 `  -F \'pdfFile=@new_candidate_resume.pdf\' \\\n` +
                 `  -F \'positionId=some-position-uuid\' \\\n` +
                 `  http://localhost:9002/api/candidates/upload-for-n8n`,
  },
  {
    method: "GET",
    path: "/api/positions",
    description: "Retrieve a list of job positions.",
    requestBody: "N/A",
    response: "JSON: `Position[]` (Array of position objects)",
    curlExample: `curl http://localhost:9002/api/positions`,
  },
  {
    method: "POST",
    path: "/api/positions",
    description: "Create a new job position.",
    requestBody: "JSON: `{ title: string, department: string, description?: string, isOpen: boolean, position_level?: string }`",
    response: "JSON: `Position` (Newly created position object)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{ \\\n` +
                 `    "title": "New Role", \\\n` +
                 `    "department": "Engineering", \\\n` +
                 `    "isOpen": true, \\\n` +
                 `    "position_level": "Senior" \\\n` +
                 `  }' \\\n` +
                 `  http://localhost:9002/api/positions`,
  },
  {
    method: "GET",
    path: "/api/positions/{id}",
    description: "Retrieve details for a specific position.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `Position` (Single position object)",
    curlExample: `curl http://localhost:9002/api/positions/your-position-id`,
  },
  {
    method: "PUT",
    path: "/api/positions/{id}",
    description: "Update a position's information.",
    requestBody: "JSON: `{ title?: string, department?: string, isOpen?: boolean, position_level?: string, ... }` (See `updatePositionSchema`)",
    response: "JSON: `Position` (Updated position object)",
    curlExample: `curl -X PUT \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{ \\\n` +
                 `    "isOpen": false, \\\n` +
                 `    "position_level": "Lead" \\\n` +
                 `  }' \\\n` +
                 `  http://localhost:9002/api/positions/your-position-id`,
  },
  {
    method: "DELETE",
    path: "/api/positions/{id}",
    description: "Delete a position. Denied if candidates are associated.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: &apos;Position deleted successfully&apos; }` (or 409 if candidates are associated)",
    curlExample: `curl -X DELETE http://localhost:9002/api/positions/your-position-id`,
  },
  {
    method: "GET",
    path: "/api/users",
    description: "Retrieve a list of application users.",
    requestBody: "N/A",
    response: "JSON: `UserProfile[]` (Array of user profile objects)",
    curlExample: `curl http://localhost:9002/api/users`,
  },
  {
    method: "POST",
    path: "/api/users",
    description: "Create a new application user. Passwords are hashed with bcrypt.",
    requestBody: "JSON: `{ name: string, email: string, password: string, role: UserRole, modulePermissions?: PlatformModuleId[], groupIds?: string[] }`",
    response: "JSON: `UserProfile` (Newly created user profile object, password not returned)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{ \\\n` +
                 `    "name": "Test User", \\\n` +
                 `    "email": "test@example.com", \\\n` +
                 `    "password": "strongpassword123", \\\n` +
                 `    "role": "Recruiter" \\\n` +
                 `  }' \\\n` +
                 `  http://localhost:9002/api/users`,
  },
  {
    method: "PUT",
    path: "/api/users/{id}",
    description: "Update an application user. Can include newPassword (hashed with bcrypt if provided).",
    requestBody: "JSON: `{ name?: string, email?: string, newPassword?: string, role?: UserRole, modulePermissions?: PlatformModuleId[], groupIds?: string[] }`",
    response: "JSON: `UserProfile` (Updated user profile object, password not returned)",
    curlExample: `curl -X PUT \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{ \\\n` +
                 `    "role": "Admin" \\\n` +
                 `  }' \\\n` +
                 `  http://localhost:9002/api/users/user-id-to-update`,
  },
  {
    method: "DELETE",
    path: "/api/users/{id}",
    description: "Delete an application user.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: &apos;User deleted successfully&apos; }`",
    curlExample: `curl -X DELETE http://localhost:9002/api/users/user-id-to-delete`,
  },
  {
    method: "POST",
    path: "/api/logs",
    description: "Create a new log entry in the database.",
    requestBody: "JSON: `{ level: LogLevel, message: string, source?: string, timestamp?: ISOString, actingUserId?: string, details?: object }`",
    response: "JSON: `LogEntry` (Newly created log entry object)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{ \\\n` +
                 `    "level": "AUDIT", \\\n` +
                 `    "message": "User logged in", \\\n` +
                 `    "source": "AuthAPI", \\\n` +
                 `    "actingUserId": "user-id-123" \\\n` +
                 `  }' \\\n` +
                 `  http://localhost:9002/api/logs`,
  },
  {
    method: "GET",
    path: "/api/logs",
    description: "Retrieve a list of log entries. Supports pagination and filtering by level, date range, user, and search query.",
    requestBody: "N/A (Query params: `limit`, `offset`, `level`, `search`, `startDate`, `endDate`, `actingUserId`)",
    response: "JSON: `{ logs: LogEntry[], total: number }`",
    curlExample: `curl 'http://localhost:9002/api/logs?level=ERROR&limit=10'`,
  },
  {
    method: "POST",
    path: "/api/auth/change-password",
    description: "Allows an authenticated user to change their own password. Passwords handled with bcrypt.",
    requestBody: "JSON: `{ currentPassword: string, newPassword: string }`",
    response: "JSON: `{ message: &apos;Password changed successfully.&apos; }` or error message.",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` + 
                 `  -d '{ \\\n` +
                 `    "currentPassword": "oldPassword123", \\\n` +
                 `    "newPassword": "newStrongPassword456" \\\n` +
                 `  }' \\\n` +
                 `  http://localhost:9002/api/auth/change-password`,
  },
  {
    method: "GET",
    path: "/api/auth/session",
    description: "Get the current user's session information (provided by NextAuth.js).",
    requestBody: "N/A",
    response: "JSON: Session object or null.",
    curlExample: `curl http://localhost:9002/api/auth/session \\\n` +
                 `  -H 'Cookie: next-auth.session-token=your-session-token-here'`, 
  },
  {
    method: "PUT",
    path: "/api/transitions/{id}",
    description: "Update the notes of a specific transition record.",
    requestBody: "JSON: `{ notes?: string }`",
    response: "JSON: `TransitionRecord` (Updated transition record)",
    curlExample: `curl -X PUT \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{ \\\n` +
                 `    "notes": "Updated notes for this stage." \\\n` +
                 `  }' \\\n` +
                 `  http://localhost:9002/api/transitions/transition-record-id`,
  },
  {
    method: "DELETE",
    path: "/api/transitions/{id}",
    description: "Delete a specific transition record.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: &apos;Transition record deleted successfully&apos; }`",
    curlExample: `curl -X DELETE http://localhost:9002/api/transitions/transition-record-id`,
  },
  {
    method: "GET",
    path: "/api/system/initial-setup-check",
    description: "Checks if essential database tables exist.",
    requestBody: "N/A",
    response: "JSON: `{ schemaInitialized: boolean, message: string, missingTables?: string[], error?: string }`",
    curlExample: `curl http://localhost:9002/api/system/initial-setup-check`,
  },
  {
    method: "POST",
    path: "/api/n8n/webhook-proxy",
    description: "Client uploads FormData (with 'pdfFile'). API proxies this to a generic processing webhook (configured via N8N_GENERIC_PDF_WEBHOOK_URL), sending JSON with file as data URI.",
    requestBody: "Client: FormData (`pdfFile`). External system receives: JSON `{ fileName: string, mimeType: string, fileDataUri: string, ... }`",
    response: "JSON: `{ message: &apos;PDF successfully sent to workflow.&apos;, n8nResponse?: any }`",
    curlExample: `# To test /api/n8n/webhook-proxy (client-side call):\n` +
                 `curl -X POST \\\n` +
                 `  -F 'pdfFile=@generic_document.pdf' \\\n` +
                 `  http://localhost:9002/api/n8n/webhook-proxy\n\n`+
                 `# Example of what the external system receives from this proxy:\n` +
                 `# POST <YOUR_GENERIC_PROCESSING_WEBHOOK_URL>\n`+
                 `# Content-Type: application/json\n`+
                 `# Body:\n` +
                 `# { \\\n` +
                 `#   "fileName": "generic_document.pdf", \\\n` +
                 `#   "mimeType": "application/pdf", \\\n` +
                 `#   "fileDataUri": "data:application/pdf;base64,..." \\\n` +
                 `# }`,
  },
];

const getMethodBadgeVariant = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
    case "POST":
      return "outline";
    case "PUT":
      return "secondary";
    case "DELETE":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function ApiDocumentationPage() {
  const [selectedCurlEndpoint, setSelectedCurlEndpoint] = useState<ApiEndpoint | null>(null);
  const [isCurlDialogOpen, setIsCurlDialogOpen] = useState(false);
  const { toast } = useToast();

  const openCurlDialog = (endpoint: ApiEndpoint) => {
    setSelectedCurlEndpoint(endpoint);
    setIsCurlDialogOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    if (!navigator.clipboard) {
      toast({
        title: "Clipboard API Not Available",
        description: "Copying to clipboard is not supported in this browser or context (e.g., non-HTTPS or sandboxed iframes). Please select the text manually.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "cURL command copied to clipboard." });
    } catch (err) {
      console.error("Failed to copy cURL command:", err);
      toast({
        title: "Failed to copy",
        description: "Could not copy cURL command. This might be due to browser permissions or if the page is not served over HTTPS. Please select the text manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Code2 className="mr-3 h-6 w-6 text-primary" /> API Documentation
        </CardTitle>
        <CardDescription>
          Overview of available API endpoints for Candidate Management.
          The base URL is <code>http://localhost:9002</code> for these examples (or your production URL).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Method</TableHead>
                <TableHead className="w-[280px]">Path</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
                <TableHead className="min-w-[250px] hidden md:table-cell">Request Body (Conceptual)</TableHead>
                <TableHead className="min-w-[250px] hidden md:table-cell">Response (Conceptual)</TableHead>
                <TableHead className="w-[100px] text-center">cURL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiEndpoints.map((endpoint) => (
                <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                  <TableCell>
                    <Badge variant={getMethodBadgeVariant(endpoint.method)} className="text-xs whitespace-nowrap">
                      {endpoint.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded break-words">{endpoint.path}</code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{endpoint.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono break-words hidden md:table-cell">
                    {endpoint.requestBody}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono break-words hidden md:table-cell">
                    {endpoint.response}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => openCurlDialog(endpoint)} aria-label="Show cURL example">
                      <Terminal className="h-5 w-5 text-primary" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 text-sm text-muted-foreground space-y-2">
          <p><strong>Authentication:</strong> API endpoints are protected by NextAuth.js session authentication. Calls from external systems require proper authentication mechanisms (e.g., API tokens managed by an API Gateway), which are not implemented in this prototype.</p>
          <p><strong>Base URL:</strong> All API paths are relative to the application&apos;s base URL (e.g., <code>http://localhost:9002</code> or your production domain).</p>
          <p><strong>Error Handling:</strong> Standard HTTP status codes are used (e.g., 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error). Error responses typically include a JSON body: <code>{`{ &quot;message&quot;: &quot;Error description&quot;, &quot;errors?&quot;: {{ ... }} }`}</code>.</p>
          <p><strong>Content Type:</strong> For POST and PUT requests with a body, set <code>Content-Type: application/json</code>, unless it&apos;s a file upload (<code>multipart/form-data</code> for resume uploads).</p>
        </div>
      </CardContent>

      {selectedCurlEndpoint && (
        <Dialog open={isCurlDialogOpen} onOpenChange={setIsCurlDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Terminal className="mr-2 h-5 w-5" /> cURL Example
              </DialogTitle>
              <DialogDescription>
                Example cURL command for <strong>{selectedCurlEndpoint.method}</strong> <code>{selectedCurlEndpoint.path}</code>.
                Remember to replace placeholders and include authentication headers/cookies if needed.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 relative group">
              <pre className="bg-muted p-4 rounded-md text-sm text-foreground overflow-x-auto">
                <code>{selectedCurlEndpoint.curlExample}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(selectedCurlEndpoint.curlExample)}
                aria-label="Copy cURL command"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
