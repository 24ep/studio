
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase, Edit, Trash2 } from "lucide-react";
import type { Position } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPositions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/positions');
        if (!response.ok) {
          const errorText = response.statusText || `Status: ${response.status}`;
          throw new Error(`Failed to fetch positions: ${errorText}`);
        }
        const data: Position[] = await response.json();
        setPositions(data);
      } catch (error) {
        console.error("Error fetching positions:", error);
        toast({
          title: "Error Fetching Positions",
          description: (error as Error).message || "Could not load position data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPositions();
  }, [toast]);

  const handleAddPosition = () => {
    console.log("Add new position action triggered");
    toast({ title: "Add Position", description: "Functionality to add a new position is not yet implemented.", variant: "default" });
    // This would typically open a modal or navigate to a form
  };

  const handleEditPosition = (position: Position) => {
    console.log("Edit position action triggered for:", position.title);
    toast({ title: "Edit Position", description: `Editing for ${position.title} is not yet implemented.`, variant: "default" });
    // This would typically open a modal or navigate to a form
  };

  const handleDeletePosition = async (position: Position) => {
    if (window.confirm(`Are you sure you want to delete the position "${position.title}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/positions/${position.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to delete position: ${response.statusText}`);
        }
        setPositions(prevPositions => prevPositions.filter(p => p.id !== position.id));
        toast({ title: "Position Deleted", description: `Position "${position.title}" has been deleted.` });
      } catch (error) {
        console.error("Error deleting position:", error);
        toast({
          title: "Error Deleting Position",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div></div>
        <Button onClick={handleAddPosition} className="w-full sm:w-auto">
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
          {isLoading ? (
            <div className="text-center py-10">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="mt-4 text-muted-foreground">Loading positions...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No positions created yet.</p>
              <Button onClick={handleAddPosition} className="mt-4">
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
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell className="font-medium">{pos.title}</TableCell>
                    <TableCell>{pos.department}</TableCell>
                    <TableCell>
                      <Badge variant={pos.isOpen ? "default" : "outline"} className={pos.isOpen ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : ""}>
                        {pos.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs hidden md:table-cell">
                      {pos.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1 h-8 w-8" onClick={() => handleEditPosition(pos)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                       <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => handleDeletePosition(pos)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
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
