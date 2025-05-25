
// src/app/api-docs/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";

const apiEndpoints = [
  {
    method: "POST",
    path: "/api/resumes",
    description: "Upload one or more candidate resumes for parsing and processing.",
    requestBody: "FormData containing resume file(s).",
    response: "Status of upload and initial processing.",
  },
  {
    method: "GET",
    path: "/api/candidates",
    description: "Retrieve a list of candidates. Supports filtering by name, position, fit score, etc.",
    requestBody: "N/A (Query parameters for filtering)",
    response: "Array of candidate objects.",
  },
  {
    method: "GET",
    path: "/api/candidates/{id}",
    description: "Retrieve details for a specific candidate.",
    requestBody: "N/A",
    response: "Single candidate object.",
  },
  {
    method: "PUT",
    path: "/api/candidates/{id}",
    description: "Update a candidate's information or status.",
    requestBody: "JSON object with candidate fields to update.",
    response: "Updated candidate object.",
  },
  {
    method: "DELETE",
    path: "/api/candidates/{id}",
    description: "Delete a candidate.",
    requestBody: "N/A",
    response: "Confirmation of deletion.",
  },
  {
    method: "GET",
    path: "/api/positions",
    description: "Retrieve a list of job positions.",
    requestBody: "N/A",
    response: "Array of position objects.",
  },
  {
    method: "POST",
    path: "/api/positions",
    description: "Create a new job position.",
    requestBody: "JSON object with position details.",
    response: "Newly created position object.",
  },
  {
    method: "GET",
    path: "/api/auth/session",
    description: "Get the current user's session information (provided by NextAuth.js).",
    requestBody: "N/A",
    response: "Session object or null.",
  },
];

const getMethodBadgeVariant = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return "outline"; // Or another color like a blue/green if available
    case "POST":
      return "default"; // Primary color
    case "PUT":
      return "secondary"; // Accent color
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
            This documentation is conceptual for this prototype.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Method</TableHead>
                  <TableHead className="w-[250px]">Path</TableHead>
                  <TableHead>Description</TableHead>
                  {/* <TableHead>Request Body</TableHead> */}
                  {/* <TableHead>Response</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiEndpoints.map((endpoint) => (
                  <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                    <TableCell>
                      <Badge variant={getMethodBadgeVariant(endpoint.method)} className="text-xs">
                        {endpoint.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">{endpoint.path}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{endpoint.description}</TableCell>
                    {/* <TableCell className="text-xs text-muted-foreground">{endpoint.requestBody}</TableCell> */}
                    {/* <TableCell className="text-xs text-muted-foreground">{endpoint.response}</TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 text-sm text-muted-foreground">
            <p><strong>Authentication:</strong> Most endpoints will require authentication. This application uses NextAuth.js with Azure AD. API requests should include the appropriate authentication token (e.g., Bearer token) in the Authorization header.</p>
            <p className="mt-2"><strong>Base URL:</strong> All API paths are relative to the application's base URL (e.g., <code>http://localhost:9002</code> or your production domain).</p>
            <p className="mt-2"><strong>Error Handling:</strong> Standard HTTP status codes will be used to indicate success or failure. Error responses will typically include a JSON body with an error message.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
