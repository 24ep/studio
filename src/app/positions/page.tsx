
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button"; 
import { PlusCircle, Briefcase, Edit, Trash2, ServerCrash, Loader2, FileDown, FileUp, ChevronDown, FileSpreadsheet } from "lucide-react";
import type { Position } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AddPositionModal, type AddPositionFormValues } from '@/components/positions/AddPositionModal';
import { EditPositionModal, type EditPositionFormValues } from '@/components/positions/EditPositionModal';
import { PositionFilters, type PositionFilterValues } from '@/components/positions/PositionFilters';
import { ImportPositionsModal } from '@/components/positions/ImportPositionsModal';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';


export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PositionFilterValues>({ isOpen: "all" });
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const { data: session, status: sessionStatus } = useSession();


  const fetchPositions = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
        setIsLoading(false); // Prevent indefinite loading
        return;
    }
    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);
    try {
      const query = new URLSearchParams();
      if (filters.title) query.append('title', filters.title);
      if (filters.department) query.append('department', filters.department);
      if (filters.isOpen && filters.isOpen !== "all") query.append('isOpen', String(filters.isOpen === "true")); 
      if (filters.positionLevel) query.append('position_level', filters.positionLevel);


      const response = await fetch(`/api/positions?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        const errorMessage = errorData.message || `Failed to fetch positions: ${response.statusText || `Status: ${response.status}`}`;
        if (response.status === 401) {
            setAuthError(true);
            signIn(undefined, { callbackUrl: pathname });
            return;
        }
        setFetchError(errorMessage);
        setPositions([]);
        return;
      }
      const data: Position[] = await response.json();
      setPositions(data);
    } catch (error) {
      console.error("Error fetching positions:", error);
      const errorMessage = (error as Error).message || "Could not load position data.";
      if (!(errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden"))) {
        setFetchError(errorMessage);
      }
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sessionStatus, pathname, signIn]); 

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      fetchPositions();
    }
  }, [filters, sessionStatus, fetchPositions, pathname, signIn]); 


  const handleFilterChange = (newFilters: PositionFilterValues) => {
    setFilters(newFilters);
  };

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
        const errorData = await response.json().catch(() => ({ message: "Failed to delete position." }));
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

  const handleDownloadExcelTemplateGuide = () => {
    const columns = [
      "title (String, Required)",
      "department (String, Required)",
      "description (String, Optional)",
      "isOpen (Boolean, Required, true/false)",
      "position_level (String, Optional, e.g., Senior, Entry Level)",
    ];
    toast({
      title: "Position Excel Import Template Guide",
      description: (
        <div className="max-h-60 overflow-y-auto">
          <p className="mb-2">Your Excel file should have a header row with the following columns. `isOpen` should contain TRUE or FALSE.</p>
          <ul className="list-disc list-inside text-xs">
            {columns.map(col => <li key={col}>{col}</li>)}
          </ul>
        </div>
      ),
      duration: 15000,
    });
  };

  const handleExportToExcel = async () => {
    setIsLoading(true);
    try {
      // Add any active filters to the export query if your API supports them
      const query = new URLSearchParams();
      if (filters.title) query.append('title', filters.title);
      if (filters.department) query.append('department', filters.department);
      if (filters.isOpen && filters.isOpen !== "all") query.append('isOpen', String(filters.isOpen === "true"));
      if (filters.positionLevel) query.append('position_level', filters.positionLevel);

      const response = await fetch(`/api/positions/export?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error exporting position data." }));
        throw new Error(errorData.message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'positions_export.csv';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export Successful", description: "Positions exported (CSV format for this prototype)." });

    } catch (error) {
      console.error("Error exporting positions:", error);
      toast({ title: "Export Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  if (sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && !pathname.startsWith('/auth/signin')) || (isLoading && !fetchError && positions.length === 0)) { 
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
   if (authError) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
            <ServerCrash className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4 max-w-md">You need to be signed in to view this page.</p>
            <Button onClick={() => signIn(undefined, { callbackUrl: pathname })} className="btn-hover-primary-gradient">Sign In</Button>
        </div>
    );
  }

  if (fetchError && !authError) {
    const isMissingTableError = fetchError.toLowerCase().includes("relation") && fetchError.toLowerCase().includes("does not exist");
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Positions</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isMissingTableError && (
            <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-md text-sm">
                <p className="font-semibold">It looks like the "Position" database table is missing.</p>
                <p className="mt-1">This usually means the database initialization script (`pg-init-scripts/init-db.sql`) did not run correctly when the PostgreSQL Docker container started.</p>
                <p className="mt-2">Please refer to the troubleshooting steps in the `README.md` for guidance on how to resolve this, typically involving a clean Docker volume reset.</p>
            </div>
        )}
        <Button onClick={fetchPositions} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
         <div className="w-full flex flex-col sm:flex-row gap-2 items-center sm:justify-start">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Import/Export <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                  <FileUp className="mr-2 h-4 w-4" /> Import Positions (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadExcelTemplateGuide}>
                  <FileDown className="mr-2 h-4 w-4" /> Download Excel Template Guide
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportToExcel} disabled={isLoading}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Positions (Excel/CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
         </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto btn-primary-gradient">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Position
        </Button>
      </div>

      <PositionFilters initialFilters={filters} onFilterChange={handleFilterChange} isLoading={isLoading} />


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
              <p className="mt-4 text-muted-foreground">No positions found. Try adjusting filters or add a new position.</p>
              <Button onClick={() => setIsAddModalOpen(true)} className="mt-4 btn-primary-gradient">
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
                    <TableCell className="font-medium">
                      <Link href={`/positions/${pos.id}`} passHref>
                        <span className="hover:underline text-primary cursor-pointer">{pos.title}</span>
                      </Link>
                    </TableCell>
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
                                  If there are candidates associated with this position, deletion might be blocked by the database.
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
      <ImportPositionsModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportSuccess={fetchPositions} 
      />
    </div>
  );
}
