
// src/app/api-docs/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Code2, Terminal } from "lucide-react";

const apiEndpoints = [
  {
    method: "POST",
    path: "/api/resumes",
    description: "Upload one or more candidate resumes for parsing and processing.",
    requestBody: "FormData: `resumes`: File[] (one or more resume files)",
    response: "JSON: `{ status: 'success', message: 'Files uploaded', count: 2 }`",
    curlExample: "curl -X POST -F 'resumes=@resume1.pdf' -F 'resumes=@resume2.docx' http://localhost:9002/api/resumes",
  },
  {
    method: "GET",
    path: "/api/candidates",
    description: "Retrieve a list of candidates. Supports filtering by name, position, fit score, etc.",
    requestBody: "N/A (Query params: `name`, `positionId`, `minFitScore`, `maxFitScore`)",
    response: "JSON: `Candidate[]` (Array of candidate objects)",
    curlExample: "curl http://localhost:9002/api/candidates?positionId=pos1",
  },
  {
    method: "GET",
    path: "/api/candidates/{id}",
    description: "Retrieve details for a specific candidate.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `Candidate` (Single candidate object)",
    curlExample: "curl http://localhost:9002/api/candidates/cand1",
  },
  {
    method: "PUT",
    path: "/api/candidates/{id}",
    description: "Update a candidate's information or status.",
    requestBody: "JSON: `{ name?: string, status?: CandidateStatus, ... }`",
    response: "JSON: `Candidate` (Updated candidate object)",
    curlExample: "curl -X PUT -H 'Content-Type: application/json' -d '{\"status\":\"Interviewing\"}' http://localhost:9002/api/candidates/cand1",
  },
  {
    method: "DELETE",
    path: "/api/candidates/{id}",
    description: "Delete a candidate.",
    requestBody: "N/A (Path parameter: `id`)",
    response: "JSON: `{ status: 'success', message: 'Candidate deleted' }`",
    curlExample: "curl -X DELETE http://localhost:9002/api/candidates/cand1",
  },
  {
    method: "GET",
    path: "/api/positions",
    description: "Retrieve a list of job positions.",
    requestBody: "N/A",
    response: "JSON: `Position[]` (Array of position objects)",
    curlExample: "curl http://localhost:9002/api/positions",
  },
  {
    method: "POST",
    path: "/api/positions",
    description: "Create a new job position.",
    requestBody: "JSON: `{ title: string, department: string, description?: string, isOpen: boolean }`",
    response: "JSON: `Position` (Newly created position object)",
    curlExample: "curl -X POST -H 'Content-Type: application/json' -d '{\"title\":\"New Role\", ...}' http://localhost:9002/api/positions",
  },
  {
    method: "GET",
    path: "/api/auth/session",
    description: "Get the current user's session information (provided by NextAuth.js).",
    requestBody: "N/A",
    response: "JSON: Session object or null.",
    curlExample: "curl http://localhost:9002/api/auth/session (Requires cookie/token)",
  },
];

const getMethodBadgeVariant = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return "outline"; 
    case "POST":
      return "default"; 
    case "PUT":
      return "secondary"; 
    case "DELETE":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function ApiDocumentationPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code2 className="mr-2 h-6 w-6 text-primary" /> API Documentation
          </CardTitle>
          <CardDescription>
            Overview of available API endpoints for CandiTrack.
            This documentation is conceptual for this prototype. Replace localhost:9002 with your actual domain.
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Terminal className="mr-2 h-5 w-5 text-primary" /> Example cURL Commands
            </h3>
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
              {apiEndpoints.map((endpoint) => (
                <div key={`curl-${endpoint.path}`} className="text-sm">
                  <p className="font-semibold text-foreground">{endpoint.method} <code className="text-primary bg-background px-1 rounded">{endpoint.path}</code></p>
                  <pre className="mt-1 p-2 bg-card rounded-md text-xs text-muted-foreground overflow-x-auto">
                    <code>{endpoint.curlExample}</code>
                  </pre>
                </div>
              ))}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 text-sm text-muted-foreground space-y-2">
            <p><strong>Authentication:</strong> Most endpoints will require authentication. This application uses NextAuth.js with Azure AD. API requests should include the appropriate authentication token (e.g., Bearer token in the Authorization header or session cookie).</p>
            <p><strong>Base URL:</strong> All API paths are relative to the application's base URL (e.g., <code>http://localhost:9002</code> or your production domain).</p>
            <p><strong>Error Handling:</strong> Standard HTTP status codes will be used to indicate success or failure. Error responses will typically include a JSON body with an error message (e.g., <code>{`{ "error": "Resource not found" }`}</code> for a 404).</p>
            <p><strong>Content Type:</strong> For POST and PUT requests with a body, ensure the <code>Content-Type</code> header is set appropriately (e.g., <code>application/json</code> for JSON data, or multipart/form-data for file uploads).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    