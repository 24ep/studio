// src/app/settings/stages/page.tsx
"use client";
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TableBody, TableCell, TableRow, } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { PlusCircle, Edit3, Trash2, KanbanSquare, Save, Loader2, ServerCrash, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
const stageFormSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().optional().nullable(),
    sort_order: z.coerce.number().int().optional().default(0),
});
export default function RecruitmentStagesPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [stages, setStages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMoving, setIsMoving] = useState(null); // Store ID of stage being moved
    const [fetchError, setFetchError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState(null);
    const [stageToDelete, setStageToDelete] = useState(null);
    const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
    const [replacementStageName, setReplacementStageName] = useState('');
    const form = useForm({
        resolver: zodResolver(stageFormSchema),
        defaultValues: { name: '', description: '', sort_order: 0 },
    });
    const fetchStages = useCallback(async () => {
        if (sessionStatus !== 'authenticated')
            return;
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await fetch('/api/settings/recruitment-stages');
            if (!response.ok) {
                let messageFromServer = `Failed to fetch stages. Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    messageFromServer = errorData.error || errorData.message || messageFromServer;
                }
                catch (e) {
                    messageFromServer = response.statusText || messageFromServer;
                }
                if (response.status === 401 || response.status === 403) {
                    setFetchError("You do not have permission to manage recruitment stages.");
                    setIsLoading(false);
                    return;
                }
                throw new Error(messageFromServer);
            }
            const data = await response.json();
            setStages(data.sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity) || a.name.localeCompare(b.name)));
        }
        catch (error) {
            console.error('Error fetching recruitment stages:', error);
            setFetchError(error.message);
        }
        finally {
            setIsLoading(false);
        }
    }, [sessionStatus, pathname]);
    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            signIn(undefined, { callbackUrl: pathname });
        }
        else if (sessionStatus === 'authenticated') {
            if (!session || (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('RECRUITMENT_STAGES_MANAGE'))) {
                setFetchError("You do not have permission to manage recruitment stages.");
                setIsLoading(false);
            }
            else {
                fetchStages();
            }
        }
    }, [sessionStatus, session, fetchStages, pathname]);
    useEffect(() => {
        if (fetchError) {
            toast.error(fetchError);
        }
    }, [fetchError]);
    const handleOpenModal = (stage = null) => {
        setEditingStage(stage);
        form.reset(stage ? { name: stage.name, description: stage.description || '', sort_order: stage.sort_order || 0 } : { name: '', description: '', sort_order: 0 });
        setIsModalOpen(true);
    };
    const handleFormSubmit = async (data) => {
        const url = editingStage ? `/api/settings/recruitment-stages/${editingStage.id}` : '/api/settings/recruitment-stages';
        const method = editingStage ? 'PUT' : 'POST';
        const payload = { ...data };
        if (editingStage?.is_system && editingStage.name === data.name) {
            delete payload.name;
        }
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok)
                throw new Error(result.message || `Failed to ${editingStage ? 'update' : 'create'} stage`);
            toast.success(`Stage ${editingStage ? 'Updated' : 'Created'}`);
            setIsModalOpen(false);
            fetchStages();
        }
        catch (error) {
            console.error('Error creating or updating stage:', error);
            toast.error(error.message);
        }
    };
    const attemptDeleteStage = async (stage, replacement) => {
        try {
            const deleteUrl = `/api/settings/recruitment-stages/${stage.id}${replacement ? `?replacementStageName=${encodeURIComponent(replacement)}` : ''}`;
            const response = await fetch(deleteUrl, { method: 'DELETE' });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (response.status === 409 && result.needsReplacement) {
                    setStageToDelete(stage);
                    setReplacementStageName('');
                    setIsReplacementModalOpen(true);
                    return;
                }
                throw new Error(result.message || `Failed to delete stage. Status: ${response.status}`);
            }
            toast.success(`Stage "${stage.name}" has been deleted.${replacement ? ` Candidates migrated to "${replacement}".` : ''}`);
            fetchStages();
        }
        catch (error) {
            console.error('Error deleting stage:', error);
            toast.error(error.message);
        }
        finally {
            if (!isReplacementModalOpen) {
                setStageToDelete(null);
            }
        }
    };
    const handleConfirmDeleteWithReplacement = async () => {
        if (stageToDelete && replacementStageName) {
            setIsReplacementModalOpen(false);
            await attemptDeleteStage(stageToDelete, replacementStageName);
            setStageToDelete(null);
            setReplacementStageName('');
        }
        else {
            toast.error("Please select a replacement stage.");
        }
    };
    const handleMoveStage = async (stageId, direction) => {
        setIsMoving(stageId);
        try {
            const response = await fetch(`/api/settings/recruitment-stages/${stageId}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to move stage');
            }
            toast.success('Recruitment stage order updated.');
            fetchStages(); // Refresh the list to show new order
        }
        catch (error) {
            console.error('Error moving stage:', error);
            toast.error(error.message);
        }
        finally {
            setIsMoving(null);
        }
    };
    const handleDragEnd = async (result) => {
        if (!result.destination)
            return;
        const reorderedStages = Array.from(stages);
        const [removed] = reorderedStages.splice(result.source.index, 1);
        reorderedStages.splice(result.destination.index, 0, removed);
        setStages(reorderedStages);
        try {
            await fetch('/api/settings/recruitment-stages/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stageIds: reorderedStages.map(s => s.id) }),
            });
            toast.success('Recruitment stage order updated.');
            fetchStages();
        }
        catch (error) {
            toast.error('Failed to update stage order.');
            fetchStages();
        }
    };
    if (sessionStatus === 'loading' || (isLoading && !fetchError && stages.length === 0)) {
        return (<div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50"><Loader2 className="h-16 w-16 animate-spin text-primary"/></div>);
    }
    if (fetchError) {
        const isPermissionError = fetchError === "You do not have permission to manage recruitment stages.";
        return (<div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4"/>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Data</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isPermissionError ? (<Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>) : (<Button onClick={fetchStages} className="btn-hover-primary-gradient">Try Again</Button>)}
      </div>);
    }
    return (<div className="space-y-6 p-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="flex items-center text-2xl"><KanbanSquare className="mr-3 h-6 w-6 text-primary"/>Recruitment Stages</CardTitle>
            <CardDescription>
              Manage the stages in your recruitment pipeline. System stages cannot be deleted or renamed.
              Use the arrow buttons to reorder stages, or the &apos;Sort Order&apos; field for specific placement.
              If a custom stage is in use, you will be prompted to migrate candidates to another stage upon deletion.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenModal()} className="btn-primary-gradient mt-2 sm:mt-0">
            <PlusCircle className="mr-2 h-4 w-4"/> Add New Stage
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading && stages.length === 0 ? (<div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary"/>
              <p className="ml-2 text-muted-foreground">Loading stages...</p>
            </div>) : stages.length === 0 && !fetchError ? (<p className="text-muted-foreground text-center">No recruitment stages configured yet.</p>) : (<div className="border rounded-lg overflow-hidden">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="stages-table">
                  {(provided) => (<TableBody ref={provided.innerRef} {...provided.droppableProps}>
                      {stages.map((stage, index) => (<Draggable key={stage.id} draggableId={stage.id} index={index}>
                          {(provided, snapshot) => (<TableRow ref={provided.innerRef} {...provided.draggableProps} style={{ ...provided.draggableProps.style, background: snapshot.isDragging ? '#f3f4f6' : undefined }}>
                              <TableCell className="py-1 px-2" {...provided.dragHandleProps}>
                                <span className="cursor-move">☰</span>
                              </TableCell>
                              <TableCell className="font-medium">{stage.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-xs sm:max-w-md truncate hidden sm:table-cell">{stage.description || 'N/A'}</TableCell>
                              <TableCell><Badge variant={stage.is_system ? "secondary" : "outline"}>{stage.is_system ? "System" : "Custom"}</Badge></TableCell>
                              <TableCell>{stage.sort_order}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(stage)} className="mr-1 h-8 w-8"><Edit3 className="h-4 w-4"/></Button>
                                {!stage.is_system && (<Button variant="ghost" size="icon" onClick={() => attemptDeleteStage(stage)} className="text-destructive hover:text-destructive h-8 w-8"><Trash2 className="h-4 w-4"/></Button>)}
                              </TableCell>
                            </TableRow>)}
                        </Draggable>))}
                      {provided.placeholder}
                    </TableBody>)}
                </Droppable>
              </DragDropContext>
            </div>)}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-4">
              <Button type="submit" disabled={form.formState.isSubmitting} className="btn-primary-gradient flex items-center gap-2">
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                {editingStage ? 'Save Changes' : 'Create Stage'}
              </Button>
            </div>
            <DialogTitle>{editingStage ? 'Edit' : 'Add New'} Recruitment Stage</DialogTitle>
            <DialogDescription>{editingStage ? 'Update the details of this stage.' : 'Define a new stage for your recruitment pipeline.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register('name')} disabled={!!editingStage?.is_system}/>
              {form.formState.errors?.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              {editingStage?.is_system && <p className="text-xs text-muted-foreground mt-1">System stage names cannot be changed.</p>}
            </div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" {...form.register('description')}/></div>
            <div><Label htmlFor="sort_order">Sort Order</Label><Input id="sort_order" type="number" {...form.register('sort_order')}/></div>
            <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isReplacementModalOpen} onOpenChange={(open) => {
            setIsReplacementModalOpen(open);
            if (!open) {
                setStageToDelete(null);
                setReplacementStageName('');
            }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><AlertCircle className="mr-2 h-5 w-5 text-amber-500"/>Stage In Use</AlertDialogTitle>
            <AlertDialogDescription>
              The stage &quot;<strong>{stageToDelete?.name}</strong>&quot; is currently in use by candidates or in transition history.
              To delete it, please select a new stage to migrate all associated records to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="replacement-stage">Select Replacement Stage</Label>
            <Select value={replacementStageName} onValueChange={setReplacementStageName}>
              <SelectTrigger id="replacement-stage" className="w-full mt-1">
                <SelectValue placeholder="Choose a new stage..."/>
              </SelectTrigger>
              <SelectContent>
                {stages.filter(s => s.id !== stageToDelete?.id && !s.is_system).map(s => (<SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsReplacementModalOpen(false); setStageToDelete(null); setReplacementStageName(''); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteWithReplacement} disabled={!replacementStageName}>
              Migrate and Delete Stage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
