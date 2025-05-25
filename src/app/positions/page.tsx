
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlusCircle, Briefcase, Edit, Trash2, ServerCrash, Loader2 } from "lucide-react";
import type { Position } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { signIn, useSession } from "next-auth/react";
import { AddPositionModal, type AddPositionFormValues } from '@/components/positions/AddPositionModal'; 
import { EditPositionModal, type EditPositionFormValues } from '@/components/positions/EditPositionModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Added AlertDialogTrigger here
} from "@/components/ui/alert-dialog";


export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);


  const fetchPositions = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        const errorMessage = errorData.message || `Failed to fetch positions: ${response.statusText || `Status: ${response.status}`}`;
        // Removed session check here as APIs are public
        setFetchError(errorMessage);
        setPositions([]); 
        return; 
      }
      const data: Position[] = await response.json();
      setPositions(data);
    } catch (error) {
      console.error("Error fetching positions:", error);
      const errorMessage = (error as Error).message || "Could not load position data.";
      setFetchError(errorMessage);
      setPositions([]); 
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);


  const handleAddPositionSubmit = async (formData: AddPositionFormValues) => {
    try {
        const response = await fetch('/api/positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
            throw new Error(errorData.message || `Failed to add position: ${response.statusText || `Status: ${response.status}`}`);
        }
        const newPosition: Position = await response.json();
        setPositions(prev => [newPosition, ...prev].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
        setIsAddModalOpen(false);
        toast({
            title: "Position Added",
            description: `${newPosition.title} has been successfully added.`,
        });
    } catch (error) {
        console.error("Error adding position:", error);
        toast({
            title: "Error Adding Position",
            description: (error as Error).message || "Could not add position.",
            variant: "destructive",
        });
    }
  };

  const handleOpenEditModal = (position: Position) => {
    setSelectedPositionForEdit(position);
    setIsEditModalOpen(true);
  };

  const handleEditPositionSubmit = async (positionId: string, data: EditPositionFormValues) => {
    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to update position: ${response.statusText || `Status: ${response.status}`}`);
      }
      const updatedPosition: Position = await response.json();
      setPositions(prevPositions => prevPositions.map(p => p.id === updatedPosition.id ? updatedPosition : p));
      setIsEditModalOpen(false);
      setSelectedPositionForEdit(null);
      toast({ title: "Position Updated", description: `Position "${updatedPosition.title}" has been updated.` });
    } catch (error) {
      console.error("Error updating position:", error);
      toast({
          title: "Error Updating Position",
          description: (error as Error).message,
          variant: "destructive",
      });
    }
  };

  const confirmDeletePosition = (position: Position) => {
    setPositionToDelete(position);
  };

  const handleDeletePosition = async () => {
    if (!positionToDelete) return;
    try {
      const response = await fetch(`/api/positions/${positionToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to delete position: ${response.statusText}`);
      }
      setPositions(prevPositions => prevPositions.filter(p => p.id !== positionToDelete!.id));
      toast({ title: "Position Deleted", description: `Position "${positionToDelete.title}" has been deleted.` });
    } catch (error) {
      console.error("Error deleting position:", error);
      toast({
          title: "Error Deleting Position",
          description: (error as Error).message,
          variant: "destructive",
      });
    } finally {
      setPositionToDelete(null); 
    }
  };


  if (isLoading && !fetchError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError) {
    const isMissingTableError = fetchError.toLowerCase().includes("relation") && fetchError.toLowerCase().includes("does not exist");
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Positions</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isMissingTableError && (
            <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-md text-sm">
                <p className="font-semibold">It looks like the necessary database tables (e.g., "Position") are missing.</p>
                <p className="mt-1">This usually means the database initialization script (`pg-init-scripts/init-db.sql`) did not run correctly when the PostgreSQL Docker container started.</p>
                <p className="mt-2">Please refer to the troubleshooting steps in the `README.md` or go to the <Link href="/setup" className="text-primary hover:underline font-medium">Application Setup</Link> page to verify the schema and find guidance.</p>
            </div>
        )}
        <Button onClick={fetchPositions} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div></div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
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
          {isLoading && positions.length === 0 && !fetchError ? ( 
            <div className="text-center py-10">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="mt-4 text-muted-foreground">Loading positions...</p>
            </div>
          ) : !isLoading && positions.length === 0 && !fetchError ? ( 
            <div className="text-center py-10">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No positions created yet.</p>
              <Button onClick={() => setIsAddModalOpen(true)} className="mt-4">
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
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{pos.title}</TableCell>
                    <TableCell>{pos.department}</TableCell>
                    <TableCell>{pos.position_level || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={pos.isOpen ? "default" : "outline"} className={pos.isOpen ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : ""}>
                        {pos.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs hidden md:table-cell">
                      {pos.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1 h-8 w-8" onClick={() => handleOpenEditModal(pos)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => confirmDeletePosition(pos)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        {positionToDelete && positionToDelete.id === pos.id && ( 
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the position <strong>{positionToDelete.title}</strong>. 
                                  If there are candidates associated with this position, deletion might be blocked.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setPositionToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeletePosition} className={buttonVariants({ variant: "destructive" })}>
                                  Delete Position
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                        )}
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
       <AddPositionModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddPosition={handleAddPositionSubmit}
      />
      {selectedPositionForEdit && (
        <EditPositionModal
            isOpen={isEditModalOpen}
            onOpenChange={(isOpen) => {
                setIsEditModalOpen(isOpen);
                if (!isOpen) setSelectedPositionForEdit(null);
            }}
            onEditPosition={handleEditPositionSubmit}
            position={selectedPositionForEdit}
        />
      )}
    </div>
  );
}
