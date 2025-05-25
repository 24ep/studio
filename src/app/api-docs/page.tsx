
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
    description: "Upload a candidate resume. Requires candidateId as query param. Sends resume to n8n if N8N_RESUME_WEBHOOK_URL is set.",
    requestBody: "FormData: `resume`: File (PDF, DOC, DOCX)",
    response: "JSON: `{ message: 'Resume uploaded successfully', filePath: '...', candidate: Candidate, n8nResponse?: {success: boolean, data?: any, error?: string} }`",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -F 'resume=@resume.pdf' \\\n` +
                 `  'http://localhost:9002/api/resumes/upload?candidateId=your-candidate-id'`,
  },
  {
    method: "GET",
    path: "/api/candidates",
    description: "Retrieve a list of candidates. Supports filtering by name, position, fit score, education.",
    requestBody: "N/A (Query params: `name`, `positionId`, `minFitScore`, `maxFitScore`, `education`)",
    response: "JSON: `Candidate[]` (Array of candidate objects)",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  'http://localhost:9002/api/candidates?positionId=your-position-id'`,
  },
  {
    method: "POST",
    path: "/api/candidates",
    description: "Create a new candidate.",
    requestBody: "JSON: See `createCandidateSchema` in API route; requires `name`, `email`, `status`. `parsedData` (CandidateDetails) is optional. `positionId` (nullable).",
    response: "JSON: `Candidate` (Newly created candidate object)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"name":"John Doe", "email":"john@example.com", "status":"Applied", "parsedData": { "personal_info": {"firstname":"John", "lastname":"Doe"}, "contact_info": {"email":"john@example.com"}}, "positionId": null}' \\\n` +
                 `  http://localhost:9002/api/candidates`,
  },
  {
    method: "GET",
    path: "/api/candidates/{id}",
    description: "Retrieve details for a specific candidate, including transition history.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `Candidate` (Single candidate object with transition history)",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/candidates/your-candidate-id`,
  },
  {
    method: "PUT",
    path: "/api/candidates/{id}",
    description: "Update a candidate's information or status. Triggers transition record creation on status change.",
    requestBody: "JSON: `{ name?: string, status?: CandidateStatus, parsedData?: CandidateDetails, ... }` (See `updateCandidateSchema`)",
    response: "JSON: `Candidate` (Updated candidate object with transition history)",
    curlExample: `curl -X PUT \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"status":"Interviewing"}' \\\n` +
                 `  http://localhost:9002/api/candidates/your-candidate-id`,
  },
  {
    method: "DELETE",
    path: "/api/candidates/{id}",
    description: "Delete a candidate. Also deletes associated transition records.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: 'Candidate deleted successfully' }`",
    curlExample: `curl -X DELETE \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/candidates/your-candidate-id`,
  },
  {
    method: "POST",
    path: "/api/candidates/upload-for-n8n",
    description: "Upload a PDF resume to be sent to an n8n workflow for new candidate creation. Requires N8N_GENERIC_PDF_WEBHOOK_URL set on server.",
    requestBody: "FormData: `pdfFile`: File (PDF)",
    response: "JSON: `{ message: 'PDF successfully sent to n8n workflow for candidate creation.', n8nResponse?: any }`",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -F 'pdfFile=@new_candidate_resume.pdf' \\\n` +
                 `  http://localhost:9002/api/candidates/upload-for-n8n`,
  },
  {
    method: "GET",
    path: "/api/positions",
    description: "Retrieve a list of job positions.",
    requestBody: "N/A",
    response: "JSON: `Position[]` (Array of position objects)",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/positions`,
  },
  {
    method: "POST",
    path: "/api/positions",
    description: "Create a new job position.",
    requestBody: "JSON: `{ title: string, department: string, description?: string, isOpen: boolean, position_level?: string }`",
    response: "JSON: `Position` (Newly created position object)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"title":"New Role", "department":"Engineering", "isOpen":true, "position_level":"Senior"}' \\\n` +
                 `  http://localhost:9002/api/positions`,
  },
  {
    method: "GET",
    path: "/api/positions/{id}",
    description: "Retrieve details for a specific position.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `Position` (Single position object)",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/positions/your-position-id`,
  },
  {
    method: "PUT",
    path: "/api/positions/{id}",
    description: "Update a position's information.",
    requestBody: "JSON: `{ title?: string, department?: string, isOpen?: boolean, position_level?: string, ... }` (See `updatePositionSchema`)",
    response: "JSON: `Position` (Updated position object)",
    curlExample: `curl -X PUT \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"isOpen":false, "position_level":"Lead"}' \\\n` +
                 `  http://localhost:9002/api/positions/your-position-id`,
  },
  {
    method: "DELETE",
    path: "/api/positions/{id}",
    description: "Delete a position. Denied if candidates are associated.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: 'Position deleted successfully' }` (or 409 if candidates are associated)",
    curlExample: `curl -X DELETE \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/positions/your-position-id`,
  },
  {
    method: "GET",
    path: "/api/users",
    description: "Retrieve a list of application users (Admin only).",
    requestBody: "N/A",
    response: "JSON: `UserProfile[]` (Array of user profile objects)",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/users`,
  },
  {
    method: "POST",
    path: "/api/users",
    description: "Create a new application user (Admin only). Passwords are hashed with bcrypt.",
    requestBody: "JSON: `{ name: string, email: string, password: string, role: UserRole, modulePermissions?: PlatformModuleId[] }`",
    response: "JSON: `UserProfile` (Newly created user profile object, password not returned)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"name":"Test User", "email":"test@example.com", "password":"strongpassword123", "role":"Recruiter"}' \\\n` +
                 `  http://localhost:9002/api/users`,
  },
  {
    method: "PUT",
    path: "/api/users/{id}",
    description: "Update an application user (Admin only). Can include newPassword (hashed with bcrypt if provided).",
    requestBody: "JSON: `{ name?: string, email?: string, newPassword?: string, role?: UserRole, modulePermissions?: PlatformModuleId[] }`",
    response: "JSON: `UserProfile` (Updated user profile object, password not returned)",
    curlExample: `curl -X PUT \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"role":"Admin"}' \\\n` +
                 `  http://localhost:9002/api/users/user-id-to-update`,
  },
  {
    method: "DELETE",
    path: "/api/users/{id}",
    description: "Delete an application user (Admin only). Cannot delete self.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: 'User deleted successfully' }`",
    curlExample: `curl -X DELETE \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/users/user-id-to-delete`,
  },
  {
    method: "POST",
    path: "/api/logs",
    description: "Create a new log entry in the database.",
    requestBody: "JSON: `{ level: LogLevel, message: string, source?: string, timestamp?: ISOString, actingUserId?: string, details?: object }`",
    response: "JSON: `LogEntry` (Newly created log entry object)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE_IF_APPLICABLE_FOR_LOGGING>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"level":"AUDIT", "message":"User logged in", "source":"AuthAPI", "actingUserId":"user-id-123"}' \\\n` +
                 `  http://localhost:9002/api/logs`,
  },
  {
    method: "GET",
    path: "/api/logs",
    description: "Retrieve a list of log entries (Admin only). Supports pagination and level filtering.",
    requestBody: "N/A (Query params: `limit`, `offset`, `level`)",
    response: "JSON: `{ logs: LogEntry[], total: number }`",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  'http://localhost:9002/api/logs?level=ERROR&limit=10'`,
  },
  {
    method: "POST",
    path: "/api/auth/change-password",
    description: "Allows an authenticated user to change their own password. Passwords handled with bcrypt.",
    requestBody: "JSON: `{ currentPassword: string, newPassword: string }`",
    response: "JSON: `{ message: 'Password changed successfully.' }` or error message.",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"currentPassword":"oldPassword123", "newPassword":"newStrongPassword456"}' \\\n` +
                 `  http://localhost:9002/api/auth/change-password`,
  },
  {
    method: "GET",
    path: "/api/auth/session",
    description: "Get the current user's session information (provided by NextAuth.js).",
    requestBody: "N/A",
    response: "JSON: Session object or null.",
    curlExample: `curl http://localhost:9002/api/auth/session \\\n` +
                 `  # (Requires authentication cookie/token in the request)`,
  },
  {
    method: "PUT",
    path: "/api/transitions/{id}",
    description: "Update the notes of a specific transition record (Admin/Recruiter only).",
    requestBody: "JSON: `{ notes?: string }`",
    response: "JSON: `TransitionRecord` (Updated transition record)",
    curlExample: `curl -X PUT \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"notes":"Updated notes for this stage."}' \\\n` +
                 `  http://localhost:9002/api/transitions/transition-record-id`,
  },
  {
    method: "DELETE",
    path: "/api/transitions/{id}",
    description: "Delete a specific transition record (Admin/Recruiter only).",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: 'Transition record deleted successfully' }`",
    curlExample: `curl -X DELETE \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/transitions/transition-record-id`,
  },
  {
    method: "GET",
    path: "/api/setup/check-db-schema",
    description: "Checks if essential database tables exist (Admin only).",
    requestBody: "N/A",
    response: "JSON: `{ status: 'ok' | 'partial' | 'error', message: string, missingTables?: string[] }`",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/setup/check-db-schema`,
  },
  {
    method: "GET",
    path: "/api/setup/check-minio-bucket",
    description: "Checks if the configured MinIO resume bucket exists (Admin only).",
    requestBody: "N/A",
    response: "JSON: `{ status: 'ok' | 'error', message: string }` or 404 if bucket not found.",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/setup/check-minio-bucket`,
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
        description: "Copying to clipboard is not supported in this browser or context (e.g., non-HTTPS or sandboxed iframes).",
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
        description: "Could not copy cURL command. This might be due to browser permissions or if the page is not served over HTTPS.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code2 className="mr-2 h-6 w-6 text-primary" /> API Documentation
          </CardTitle>
          <CardDescription>
            Overview of available API endpoints for NCC Candidate Management.
            Replace localhost:9002 with your actual domain. All protected routes require authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Method</TableHead>
                  <TableHead className="w-[280px]">Path</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="min-w-[250px]">Request Body (Conceptual)</TableHead>
                  <TableHead className="min-w-[250px]">Response (Conceptual)</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">{endpoint.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono break-words">
                      {endpoint.requestBody}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono break-words">
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
            <p><strong>Authentication:</strong> Most endpoints require authentication via Azure AD or Credentials (NextAuth.js). API requests should include the session cookie or a valid authorization token (e.g., <code>Authorization: Bearer &lt;YOUR_TOKEN&gt;</code>). Unauthenticated requests to protected routes will receive a 401 Unauthorized response.</p>
            <p><strong>Base URL:</strong> All API paths are relative to the application's base URL (e.g., <code>http://localhost:9002</code> or your production domain).</p>
            <p><strong>Error Handling:</strong> Standard HTTP status codes are used (e.g., 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error). Error responses typically include a JSON body: <code>{`{ "message": "Error description", "errors?": { ... } }`}</code>.</p>
            <p><strong>Content Type:</strong> For POST and PUT requests with a body, set <code>Content-Type: application/json</code>, unless it's a file upload (<code>multipart/form-data</code> for resume uploads).</p>
          </div>
        </CardContent>
      </Card>

      {selectedCurlEndpoint && (
        <Dialog open={isCurlDialogOpen} onOpenChange={setIsCurlDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Terminal className="mr-2 h-5 w-5" /> cURL Example
              </DialogTitle>
              <DialogDescription>
                Example cURL command for <strong>{selectedCurlEndpoint.method}</strong> <code>{selectedCurlEndpoint.path}</code>.
                Remember to replace placeholders like <code>&lt;YOUR_AUTH_TOKEN_OR_COOKIE&gt;</code> with actual values and ensure your session cookie is included for authenticated requests if not using a bearer token.
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
    </div>
  );
}
