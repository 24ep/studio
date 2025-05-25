
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
    description: "Upload a candidate resume. Requires candidateId as query param.",
    requestBody: "FormData: `resume`: File (PDF, DOC, DOCX)",
    response: "JSON: `{ message: 'Resume uploaded successfully', filePath: '...', candidate: Candidate }`",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -F 'resume=@resume.pdf' \\\n` +
                 `  'http://localhost:9002/api/resumes/upload?candidateId=your-candidate-id'`,
  },
  {
    method: "GET",
    path: "/api/candidates",
    description: "Retrieve a list of candidates. Supports filtering by name, position, fit score, etc.",
    requestBody: "N/A (Query params: `name`, `positionId`, `minFitScore`, `maxFitScore`)",
    response: "JSON: `Candidate[]` (Array of candidate objects)",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  'http://localhost:9002/api/candidates?positionId=your-position-id'`,
  },
  {
    method: "POST",
    path: "/api/candidates",
    description: "Create a new candidate.",
    requestBody: "JSON: See AddCandidateFormValues type; requires `name`, `email`, `positionId` (nullable), `parsedData` (CandidateDetails)",
    response: "JSON: `Candidate` (Newly created candidate object)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"name":"John Doe", "email":"john@example.com", "positionId": null, "parsedData": { "personal_info": {"firstname":"John", "lastname":"Doe"}, "contact_info": {"email":"john@example.com"}}}' \\\n` +
                 `  http://localhost:9002/api/candidates`,
  },
  {
    method: "GET",
    path: "/api/candidates/{id}",
    description: "Retrieve details for a specific candidate.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `Candidate` (Single candidate object)",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/candidates/your-candidate-id`,
  },
  {
    method: "PUT",
    path: "/api/candidates/{id}",
    description: "Update a candidate's information or status.",
    requestBody: "JSON: `{ name?: string, status?: CandidateStatus, parsedData?: CandidateDetails, ... }`",
    response: "JSON: `Candidate` (Updated candidate object)",
    curlExample: `curl -X PUT \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"status":"Interviewing"}' \\\n` +
                 `  http://localhost:9002/api/candidates/your-candidate-id`,
  },
  {
    method: "DELETE",
    path: "/api/candidates/{id}",
    description: "Delete a candidate.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: 'Candidate deleted successfully' }`",
    curlExample: `curl -X DELETE \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/candidates/your-candidate-id`,
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
    requestBody: "JSON: `{ title?: string, department?: string, isOpen?: boolean, position_level?: string, ... }`",
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
    description: "Delete a position.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ message: 'Position deleted successfully' }` (or 409 if candidates are associated)",
    curlExample: `curl -X DELETE \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/positions/your-position-id`,
  },
  {
    method: "GET",
    path: "/api/users",
    description: "Retrieve a list of application users (requires Admin role).",
    requestBody: "N/A",
    response: "JSON: `UserProfile[]` (Array of user profile objects)",
    curlExample: `curl -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  http://localhost:9002/api/users`,
  },
  {
    method: "POST",
    path: "/api/users",
    description: "Create a new application user (requires Admin role).",
    requestBody: "JSON: `{ name: string, email: string, password: string, role: UserRole }`",
    response: "JSON: `UserProfile` (Newly created user profile object)",
    curlExample: `curl -X POST \\\n` +
                 `  -H 'Authorization: Bearer <YOUR_AUTH_TOKEN_OR_COOKIE>' \\\n` +
                 `  -H 'Content-Type: application/json' \\\n` +
                 `  -d '{"name":"Test User", "email":"test@example.com", "password":"strongpassword123", "role":"Recruiter"}' \\\n` +
                 `  http://localhost:9002/api/users`,
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
    method: "GET",
    path: "/api/auth/session",
    description: "Get the current user's session information (provided by NextAuth.js).",
    requestBody: "N/A",
    response: "JSON: Session object or null.",
    curlExample: `curl http://localhost:9002/api/auth/session \\\n` +
                 `  # (Requires authentication cookie/token in the request)`,
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
        description: "Copying to clipboard is not supported in this browser or context (e.g., non-HTTPS).",
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
                  <TableHead className="w-[220px]">Path</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="min-w-[200px]">Request Body (Conceptual)</TableHead>
                  <TableHead className="min-w-[200px]">Response (Conceptual)</TableHead>
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
            <p><strong>Authentication:</strong> Most endpoints require authentication via Azure AD or Credentials (NextAuth.js). API requests should include the session cookie or a valid authorization token. Unauthenticated requests to protected routes will receive a 401 Unauthorized response.</p>
            <p><strong>Base URL:</strong> All API paths are relative to the application's base URL (e.g., <code>http://localhost:9002</code> or your production domain).</p>
            <p><strong>Error Handling:</strong> Standard HTTP status codes are used (e.g., 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error). Error responses typically include a JSON body: <code>{`{ "message": "Error description", "errors?": { ... } }`}</code>.</p>
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
