// src/components/positions/PositionsPageClient.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Briefcase, Edit, Trash2, ServerCrash, Loader2, FileDown, FileUp, ChevronDown, FileSpreadsheet, ShieldAlert, MoreHorizontal, Trash2 as BulkTrashIcon, Edit as BulkEditIcon } from "lucide-react";
import type { Position } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
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
import * as React from 'react';

interface PositionsPageClientProps {
  initialPositions: Position[];
  initialAvailableDepartments: string[];
  initialFetchError?: string;
  authError?: boolean;
  permissionError?: boolean;
}

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

export default function PositionsPageClient({
  initialPositions,
  initialAvailableDepartments,
  initialFetchError,
  authError: serverAuthError = false,
  permissionError: serverPermissionError = false,
}: PositionsPageClientProps) {
  const [positions, setPositions] = useState<Position[]>(initialPositions || []);
  const [isLoading, setIsLoading] = useState(false); // Only for client-side actions/refreshes
  const [filters, setFilters] = useState<PositionFilterValues>({ isOpen: "all" });
  const router = useRouter();
  const pathname = usePathname();
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError || null);
  const [authError, setAuthError] = useState(serverAuthError);
  const [permissionError, setPermissionError] = useState(serverPermissionError);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>(initialAvailableDepartments || []);

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

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchPaginatedPositions = useCallback(async (currentFilters: PositionFilterValues, page: number, pageSize: number) => {
    if (sessionStatus !== 'authenticated') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);
    setPermissionError(false);
    try {
      const query = new URLSearchParams();
      const activeFilters = currentFilters || filters;
      if (activeFilters.title) query.append('title', activeFilters.title);
      if (activeFilters.selectedDepartments && activeFilters.selectedDepartments.length > 0) query.append('department', activeFilters.selectedDepartments.join(','));
      if (activeFilters.isOpen && activeFilters.isOpen !== "all") query.append('isOpen', String(activeFilters.isOpen === "true"));
      if (activeFilters.positionLevel) query.append('position_level', activeFilters.positionLevel);
      query.append('limit', String(pageSize));
      query.append('offset', String((page - 1) * pageSize));
      const response = await fetch(`/api/positions?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        const errorMessage = errorData.message || `Failed to fetch positions: ${response.statusText || `Status: ${response.status}`}`;
        if (response.status === 401) {
            setAuthError(true); return;
        }
        if (response.status === 403) {
            setPermissionError(true); setFetchError(errorMessage); setPositions([]); return;
        }
        setFetchError(errorMessage); setPositions([]); return;
      }
      const data = await response.json();
      setPositions(data.data);
      setTotal(data.total);
      const uniqueDepts = Array.from(
        new Set(
          data.data.map((p: Position) => String(p.department)).filter((d: string) => typeof d === 'string' && Boolean(d))
        )
      );
      setAvailableDepartments((uniqueDepts as string[]).sort());
    } catch (error) {
      const errorMessage = (error as Error).message || "Could not load position data.";
      if (!(errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden"))) {
        setFetchError(errorMessage);
      }
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sessionStatus]);

  useEffect(() => {
    fetchPaginatedPositions(filters, page, pageSize);
  }, [fetchPaginatedPositions, filters, page, pageSize]);

  const handleFilterChange = (newFilters: PositionFilterValues) => {
    setFilters(newFilters);
    fetchPaginatedPositions(newFilters, page, pageSize); // Fetch with new filters
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
        fetchPaginatedPositions(filters, page, pageSize);
        setIsAddModalOpen(false);
        toast.success(`${newPosition.title} has been successfully added.`);
    } catch (error) {
        console.error("Error adding position:", error);
          toast.error((error as Error).message);
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
      fetchPaginatedPositions(filters, page, pageSize);
      setIsEditModalOpen(false);
      setSelectedPositionForEdit(null);
      toast.success(`Position "${updatedPosition.title}" has been updated.`);
    } catch (error) {
      console.error("Error updating position:", error);
        toast.error((error as Error).message);
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
      fetchPaginatedPositions(filters, page, pageSize);
      toast.success(`Position "${positionToDelete.title}" has been deleted.`);
    } catch (error) {
      console.error("Error deleting position:", error);
        toast.error((error as Error).message);
    } finally {
      setPositionToDelete(null);
    }
  };

  const handleDownloadCsvTemplate = () => { /* ... (existing unchanged) ... */ const headers = ["title", "department", "description", "isOpen", "position_level"];
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
    toast.success("A CSV template for positions has been downloaded."); };

  const handleExportToCsv = async () => { /* ... (existing unchanged) ... */ setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.title) query.append('title', filters.title);
      if (filters.selectedDepartments && filters.selectedDepartments.length > 0) query.append('department', filters.selectedDepartments.join(','));
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

      toast.success("Positions exported as CSV.");

    } catch (error) {
      console.error("Error exporting positions:", error);
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    } };

  const handleToggleSelectPosition = (positionId: string) => { /* ... (existing unchanged) ... */ setSelectedPositionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(positionId)) newSet.delete(positionId);
      else newSet.add(positionId);
      return newSet;
    }); };

  const handleToggleSelectAllPositions = () => { /* ... (existing unchanged) ... */ if (selectedPositionIds.size === positions.length && positions.length > 0) {
      setSelectedPositionIds(new Set());
    } else {
      setSelectedPositionIds(new Set(positions.map(p => p.id)));
    } };

  const isAllPositionsSelected = useMemo(() => { /* ... (existing unchanged) ... */ if (positions.length === 0) return false;
    return selectedPositionIds.size === positions.length; }, [selectedPositionIds, positions]);

  const handleBulkPositionAction = (action: 'delete' | 'change_status') => { /* ... (existing unchanged) ... */ setBulkActionType(action);
    if (action === 'change_status') {
      setBulkNewIsOpenStatus(true);
    }
    setIsBulkConfirmOpen(true); };

  const executeBulkPositionAction = async () => { /* ... (existing unchanged) ... */ if (!bulkActionType || selectedPositionIds.size === 0) return;
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

        toast.success(`${result.successCount} position(s) affected. ${result.failCount > 0 ? `${result.failCount} failed.` : ''}`);
        if (result.failCount > 0 && result.failedDetails) {
            result.failedDetails.forEach((detail: {positionId: string, reason: string}) => {
                const pos = positions.find(p => p.id === detail.positionId);
                toast.error(`Action Failed for ${pos?.title || detail.positionId}: ${detail.reason}`);
            });
        }
        setSelectedPositionIds(new Set());
        fetchPaginatedPositions(filters, page, pageSize);
    } catch (error) {
        toast.error((error as Error).message);
    } finally {
        setIsLoading(false);
        setIsBulkConfirmOpen(false);
        setBulkActionType(null);
    } };

  // Pagination controls
  const totalPages = Math.ceil(total / pageSize);

  if (authError) return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ServerCrash className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">You need to be signed in to view this page.</p> <Button onClick={() => signIn(undefined, { callbackUrl: pathname })} className="btn-hover-primary-gradient">Sign In</Button> </div> );
  if (permissionError) return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ServerCrash className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Permission Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">{fetchError || "You do not have permission to view positions."}</p> <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Home</Button> </div> );
  if (sessionStatus === 'loading' || isLoading) return ( <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50"> <Loader2 className="h-16 w-16 animate-spin text-primary" /> </div> );
  if (fetchError && !isLoading) return ( /* ... (existing unchanged error UI) ... */ <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Positions</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={() => fetchPaginatedPositions(filters, page, pageSize)} className="btn-hover-primary-gradient">Try Again</Button>
      </div> );


  return (
    <div className="space-y-6 p-6">
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
                  <DropdownMenuItem onSelect={() => handleBulkPositionAction('delete')}>
                    <BulkTrashIcon className="mr-2 h-4 w-4" /> Delete Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleBulkPositionAction('change_status')}>
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
              {canImportPositions && (<DropdownMenuItem onSelect={() => setIsImportModalOpen(true)}> <FileUp className="mr-2 h-4 w-4" /> Import Positions (CSV) </DropdownMenuItem>)}
              {canImportPositions && (<DropdownMenuItem onSelect={handleDownloadCsvTemplate}> <FileDown className="mr-2 h-4 w-4" /> Download CSV Template </DropdownMenuItem>)}
              {canExportPositions && (<DropdownMenuItem onSelect={handleExportToCsv} disabled={isLoading}> <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Positions (CSV) </DropdownMenuItem>)}
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
          {isLoading && positions.length === 0 && !fetchError ? ( /* ... existing JSX for loading ... */ <div className="text-center py-10"> <Briefcase className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" /> <p className="mt-4 text-muted-foreground">Loading positions...</p> </div>
          ) : !isLoading && positions.length === 0 && !fetchError ? ( /* ... existing JSX for no positions ... */ <div className="text-center py-10"> <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" /> <p className="mt-4 text-muted-foreground">No positions found. Try adjusting filters or add a new position.</p> <Button onClick={() => setIsAddModalOpen(true)} className="mt-4 btn-primary-gradient"> <PlusCircle className="mr-2 h-4 w-4" /> Add New Position </Button> </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead className="w-12"><Checkbox
                    checked={isAllPositionsSelected}
                    onCheckedChange={handleToggleSelectAllPositions}
                    aria-label="Select all positions"
                    disabled={isLoading || !canManagePositions}
                  /></TableHead><TableHead>Title</TableHead><TableHead className="hidden sm:table-cell">Department</TableHead><TableHead className="hidden md:table-cell">Level</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.id} className="hover:bg-muted/50 transition-colors" data-state={selectedPositionIds.has(pos.id) ? "selected" : ""}>
                    <TableCell><Checkbox
                        checked={selectedPositionIds.has(pos.id)}
                        onCheckedChange={() => handleToggleSelectPosition(pos.id)}
                        aria-label={`Select position ${pos.title}`}
                        disabled={isLoading || !canManagePositions}
                      /></TableCell>
                    <TableCell className="font-medium"> <Link href={`/positions/${pos.id}`} passHref> <span className="hover:underline text-primary cursor-pointer">{pos.title}</span> </Link> </TableCell>
                    <TableCell className="hidden sm:table-cell">{pos.department}</TableCell>
                    <TableCell className="hidden md:table-cell">{pos.position_level || 'N/A'}</TableCell>
                    <TableCell> <Badge variant={pos.isOpen ? "default" : "outline"} className={pos.isOpen ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : ""}> {pos.isOpen ? "Open" : "Closed"} </Badge> </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1 h-8 w-8" onClick={() => handleOpenEditModal(pos)} disabled={!canManagePositions}> <Edit className="h-4 w-4" /> <span className="sr-only">Edit</span> </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => confirmDeletePosition(pos)} disabled={!canManagePositions}> <Trash2 className="h-4 w-4" /> <span className="sr-only">Delete</span> </Button></AlertDialogTrigger>
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
      {canImportPositions && <ImportPositionsModal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImportSuccess={() => fetchPaginatedPositions(filters, page, pageSize)} />}

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

      <div className="flex justify-center items-center gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</Button>
        {Array.from({ length: totalPages }, (_, i) => (
          <Button
            key={i + 1}
            variant={page === i + 1 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
      </div>
    </div>
  );
}
