
// src/app/positions/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from '@/components/ui/button'; 
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Briefcase, Edit, Trash2, ServerCrash, Loader2, FileDown, FileUp, ChevronDown, FileSpreadsheet, ShieldAlert, MoreHorizontal, Trash2 as BulkTrashIcon, Edit as BulkEditIcon } from "lucide-react";
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
  AlertDialogTrigger, // Added missing import
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PositionFilterValues>({ isOpen: "all" });
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const { data: session, status: sessionStatus } = useSession();

  const [selectedPositionIds, setSelectedPositionIds] = useState<Set<string>>(new Set());
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'change_status' | null>(null);
  const [bulkNewIsOpenStatus, setBulkNewIsOpenStatus] = useState<boolean>(true);

  const canImportPositions = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('POSITIONS_IMPORT');
  const canExportPositions = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('POSITIONS_EXPORT');
  const canManagePositions = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('POSITIONS_MANAGE');


  const fetchPositions = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);
    try {
      const query = new URLSearchParams();
      if (filters.title) query.append('title', filters.title);
      if (filters.department && filters.department !== "__ALL_DEPARTMENTS__") query.append('department', filters.department);
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
      
      const uniqueDepts = Array.from(new Set(data.map(p => p.department).filter(Boolean)));
      setAvailableDepartments(uniqueDepts.sort());

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
        fetchPositions(); 
        setIsAddModalOpen(false);
        toast({ title: "Position Added", description: `${newPosition.title} has been successfully added.` });
    } catch (error) {
        console.error("Error adding position:", error);
          toast({ title: "Error Adding Position", description: (error as Error).message, variant: "destructive" });
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
      fetchPositions(); 
      setIsEditModalOpen(false);
      setSelectedPositionForEdit(null);
      toast({ title: "Position Updated", description: `Position "${updatedPosition.title}" has been updated.` });
    } catch (error) {
      console.error("Error updating position:", error);
        toast({ title: "Error Updating Position", description: (error as Error).message, variant: "destructive" });
    }
  };

  const confirmDeletePosition = (position: Position) => {
    setPositionToDelete(position);
  };

  const handleDeletePosition = async () => {
    if (!positionToDelete) return;
    try {
      const response = await fetch(`/api/positions/${positionToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: "Failed to delete position."}));
        throw new Error(errorData.message || `Failed to delete position: ${response.statusText}`);
      }
      fetchPositions(); 
      toast({ title: "Position Deleted", description: `Position "${positionToDelete.title}" has been deleted.` });
    } catch (error) {
      console.error("Error deleting position:", error);
        toast({ title: "Error Deleting Position", description: (error as Error).message, variant: "destructive" });
    } finally {
      setPositionToDelete(null);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const headers = ["title", "department", "description", "isOpen", "position_level"];
    const exampleRows = [
        ["Software Engineer (Backend)", "Technology", "Develops robust backend services for our platform.", "true", "Senior"],
        ["UX/UI Designer", "Design", "Creates intuitive and visually appealing user interfaces for web and mobile applications.", "true", "Mid-Level"],
        ["Marketing Specialist", "Marketing", "Develops and executes marketing campaigns across various channels.", "true", "Entry Level"],
        ["Sales Director", "Sales", "Leads the sales team, develops sales strategies, and manages key client accounts.", "false", "Executive"]
    ];
    let csvContent = headers.join(',') + '\n';
    exampleRows.forEach(row => {
        csvContent += row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    downloadFile(csvContent, 'positions_template.csv', 'text/csv;charset=utf-8;');
    toast({ title: "Template Downloaded", description: "A CSV template for positions has been downloaded." });
  };

  const handleExportToCsv = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.title) query.append('title', filters.title);
      if (filters.department && filters.department !== "__ALL_DEPARTMENTS__") query.append('department', filters.department);
      if (filters.isOpen && filters.isOpen !== "all") query.append('isOpen', String(filters.isOpen === "true"));
      if (filters.positionLevel) query.append('position_level', filters.positionLevel);

      const response = await fetch(`/api/positions/export?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error exporting position data." }));
        throw new Error(errorData.message);
      }

      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'positions_export.csv';
      downloadFile(await blob.text(), filename, blob.type);

      toast({ title: "Export Successful", description: "Positions exported as CSV." });

    } catch (error) {
      console.error("Error exporting positions:", error);
      toast({ title: "Export Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelectPosition = (positionId: string) => {
    setSelectedPositionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(positionId)) newSet.delete(positionId);
      else newSet.add(positionId);
      return newSet;
    });
  };

  const handleToggleSelectAllPositions = () => {
    if (selectedPositionIds.size === positions.length && positions.length > 0) {
      setSelectedPositionIds(new Set());
    } else {
      setSelectedPositionIds(new Set(positions.map(p => p.id)));
    }
  };

  const isAllPositionsSelected = useMemo(() => {
    if (positions.length === 0) return false;
    return selectedPositionIds.size === positions.length;
  }, [selectedPositionIds, positions]);

  const handleBulkPositionAction = (action: 'delete' | 'change_status') => {
    setBulkActionType(action);
    if (action === 'change_status') {
      setBulkNewIsOpenStatus(true); 
    }
    setIsBulkConfirmOpen(true);
  };

  const executeBulkPositionAction = async () => {
    if (!bulkActionType || selectedPositionIds.size === 0) return;
    setIsLoading(true);
    try {
        const payload = {
            action: bulkActionType,
            positionIds: Array.from(selectedPositionIds),
            ...(bulkActionType === 'change_status' && { newIsOpenStatus: bulkNewIsOpenStatus }),
        };
        const response = await fetch('/api/positions/bulk-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Bulk position action failed');
        
        toast({ title: "Bulk Action Successful", description: `${result.successCount} position(s) affected. ${result.failCount > 0 ? `${result.failCount} failed.` : ''}`});
        if (result.failCount > 0 && result.failedDetails) {
            result.failedDetails.forEach((detail: {positionId: string, reason: string}) => {
                const pos = positions.find(p => p.id === detail.positionId);
                toast({ title: `Action Failed for ${pos?.title || detail.positionId}`, description: detail.reason, variant: "warning" });
            });
        }
        setSelectedPositionIds(new Set());
        fetchPositions();
    } catch (error) {
        toast({ title: "Bulk Action Error", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsLoading(false);
        setIsBulkConfirmOpen(false);
        setBulkActionType(null);
    }
  };


  if (sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && !pathname.startsWith('/auth/signin')) || (isLoading && !fetchError && positions.length === 0)) {
    return ( <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50"> <Loader2 className="h-16 w-16 animate-spin text-primary" /> </div> );
  }
   if (authError) {
    return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ServerCrash className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">You need to be signed in to view this page.</p> <Button onClick={() => signIn(undefined, { callbackUrl: pathname })} className="btn-hover-primary-gradient">Sign In</Button> </div> );
  }

  if (fetchError && !authError) {
    const isMissingTableError = fetchError.toLowerCase().includes("relation") && fetchError.toLowerCase().includes("does not exist");
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Positions</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isMissingTableError && ( <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-md text-sm"> <p className="font-semibold">It looks like the "Position" database table is missing.</p> <p className="mt-1">This usually means the database initialization script (`pg-init-scripts/init-db.sql`) did not run correctly when the PostgreSQL Docker container started.</p> <p className="mt-2">Please refer to the troubleshooting steps in the `README.md` for guidance on how to resolve this, typically involving a clean Docker volume reset.</p> </div> )}
        <Button onClick={fetchPositions} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
         <div className="w-full flex flex-col sm:flex-row gap-2 items-center sm:justify-start">
           {selectedPositionIds.size > 0 && canManagePositions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Bulk Actions ({selectedPositionIds.size}) <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleBulkPositionAction('delete')}>
                    <BulkTrashIcon className="mr-2 h-4 w-4" /> Delete Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPositionAction('change_status')}>
                    <BulkEditIcon className="mr-2 h-4 w-4" /> Change Status (Open/Closed)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           )}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto"> Import/Export <ChevronDown className="ml-2 h-4 w-4" /> </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {canImportPositions && (<DropdownMenuItem onClick={() => setIsImportModalOpen(true)}> <FileUp className="mr-2 h-4 w-4" /> Import Positions (CSV) </DropdownMenuItem>)}
              {canImportPositions && (<DropdownMenuItem onClick={handleDownloadCsvTemplate}> <FileDown className="mr-2 h-4 w-4" /> Download CSV Template </DropdownMenuItem>)}
              {canExportPositions && (<DropdownMenuItem onClick={handleExportToCsv} disabled={isLoading}> <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Positions (CSV) </DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
         </div>
         {canManagePositions && (
            <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto btn-primary-gradient"> <PlusCircle className="mr-2 h-4 w-4" /> Add New Position </Button>
         )}
      </div>

      <PositionFilters initialFilters={filters} onFilterChange={handleFilterChange} isLoading={isLoading} availableDepartments={availableDepartments} />


      <Card className="shadow-sm">
        <CardHeader> <CardTitle className="flex items-center"> <Briefcase className="mr-2 h-5 w-5 text-primary" /> Job Positions </CardTitle> <CardDescription>Manage job positions and their statuses.</CardDescription> </CardHeader>
        <CardContent>
          {isLoading && positions.length === 0 && !fetchError ? ( <div className="text-center py-10"> <Briefcase className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" /> <p className="mt-4 text-muted-foreground">Loading positions...</p> </div>
          ) : !isLoading && positions.length === 0 && !fetchError ? ( <div className="text-center py-10"> <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" /> <p className="mt-4 text-muted-foreground">No positions found. Try adjusting filters or add a new position.</p> <Button onClick={() => setIsAddModalOpen(true)} className="mt-4 btn-primary-gradient"> <PlusCircle className="mr-2 h-4 w-4" /> Add New Position </Button> </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader> <TableRow> 
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllPositionsSelected}
                    onCheckedChange={handleToggleSelectAllPositions}
                    aria-label="Select all positions"
                    disabled={isLoading || !canManagePositions}
                  />
                </TableHead>
                <TableHead>Title</TableHead> <TableHead>Department</TableHead> <TableHead>Level</TableHead> <TableHead>Status</TableHead> <TableHead className="hidden md:table-cell">Description</TableHead> <TableHead className="text-right">Actions</TableHead> </TableRow> </TableHeader>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.id} className="hover:bg-muted/50 transition-colors" data-state={selectedPositionIds.has(pos.id) ? "selected" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPositionIds.has(pos.id)}
                        onCheckedChange={() => handleToggleSelectPosition(pos.id)}
                        aria-label={`Select position ${pos.title}`}
                        disabled={isLoading || !canManagePositions}
                      />
                    </TableCell>
                    <TableCell className="font-medium"> <Link href={`/positions/${pos.id}`} passHref> <span className="hover:underline text-primary cursor-pointer">{pos.title}</span> </Link> </TableCell>
                    <TableCell>{pos.department}</TableCell>
                    <TableCell>{pos.position_level || 'N/A'}</TableCell>
                    <TableCell> <Badge variant={pos.isOpen ? "default" : "outline"} className={pos.isOpen ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : ""}> {pos.isOpen ? "Open" : "Closed"} </Badge> </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs hidden md:table-cell"> {pos.description || "No description"} </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1 h-8 w-8" onClick={() => handleOpenEditModal(pos)} disabled={!canManagePositions}> <Edit className="h-4 w-4" /> <span className="sr-only">Edit</span> </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => confirmDeletePosition(pos)} disabled={!canManagePositions}> <Trash2 className="h-4 w-4" /> <span className="sr-only">Delete</span> </Button>
                        </AlertDialogTrigger>
                        {positionToDelete && positionToDelete.id === pos.id && ( <AlertDialogContent> <AlertDialogHeader> <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle> <AlertDialogDescription> This action cannot be undone. This will permanently delete the position <strong>{positionToDelete.title}</strong>. If there are candidates associated with this position, deletion might be blocked. </AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel onClick={() => setPositionToDelete(null)}>Cancel</AlertDialogCancel> <AlertDialogAction onClick={handleDeletePosition} className={buttonVariants({ variant: "destructive" })}> Delete Position </AlertDialogAction> </AlertDialogFooter> </AlertDialogContent> )}
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
      {canManagePositions && <AddPositionModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} onAddPosition={handleAddPositionSubmit} />}
      {canManagePositions && selectedPositionForEdit && ( <EditPositionModal isOpen={isEditModalOpen} onOpenChange={(isOpen) => { setIsEditModalOpen(isOpen); if (!isOpen) setSelectedPositionForEdit(null); }} onEditPosition={handleEditPositionSubmit} position={selectedPositionForEdit} /> )}
      {canImportPositions && <ImportPositionsModal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImportSuccess={fetchPositions} />}
    
      <AlertDialog open={isBulkConfirmOpen} onOpenChange={setIsBulkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Position Action</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to perform <strong>{bulkActionType?.replace('_', ' ')}</strong> on <strong>{selectedPositionIds.size}</strong> selected position(s).
              {bulkActionType === 'delete' && " This action cannot be undone and might fail if positions have associated candidates."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkActionType === 'change_status' && (
            <div className="my-4 space-y-2">
              <Label htmlFor="bulk-position-status">New Status</Label>
              <Select value={String(bulkNewIsOpenStatus)} onValueChange={(value) => setBulkNewIsOpenStatus(value === 'true')}>
                <SelectTrigger id="bulk-position-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="true">Open</SelectItem>
                    <SelectItem value="false">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setIsBulkConfirmOpen(false); setBulkActionType(null);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkPositionAction} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null} Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

