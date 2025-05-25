
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase } from "lucide-react";
import { mockPositions } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PositionsPage() {
  const positions = mockPositions; // In a real app, fetch this

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        {/* Page title is handled by Header component */}
        <div></div>
        <Button className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Position
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
             <Briefcase className="mr-2 h-5 w-5 text-primary" /> Job Positions
          </CardTitle>
          <CardDescription>Manage job positions and their statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No positions created yet.</p>
              <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Position
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell className="font-medium">{pos.title}</TableCell>
                    <TableCell>{pos.department}</TableCell>
                    <TableCell>
                      <Badge variant={pos.isOpen ? "default" : "outline"}>
                        {pos.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                      {pos.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
