
// src/app/settings/stages/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { RecruitmentStage } from '@/lib/types';
import { PlusCircle, Edit3, Trash2, KanbanSquare, Save, Loader2, ServerCrash, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const stageFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().optional().default(0),
});
type StageFormValues = z.infer<typeof stageFormSchema>;

export default function RecruitmentStagesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [stages, setStages] = useState<RecruitmentStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<RecruitmentStage | null>(null);
  const [stageToDelete, setStageToDelete] = useState<RecruitmentStage | null>(null);

  const form = useForm<StageFormValues>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: { name: '', description: '', sort_order: 0 },
  });

  const fetchStages = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/recruitment-stages');
      if (!response.ok) {
        let messageFromServer = `Failed to fetch stages. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          // The API route /api/settings/recruitment-stages returns a JSON object
          // with { message: "wrapper", error: "original_error_message" } on 500.
          // Prioritize displaying the more specific 'error' field.
          messageFromServer = errorData.error || errorData.message || messageFromServer;
        } catch (e) {
          // If response is not JSON (unexpected for this API's 500 error), use statusText
          messageFromServer = response.statusText || messageFromServer;
        }

        if (response.status === 401 || response.status === 403) {
            signIn(undefined, { callbackUrl: pathname });
            return;
        }
        throw new Error(messageFromServer);
      }
      const data: RecruitmentStage[] = await response.json();
      setStages(data);
    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, pathname, signIn]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('RECRUITMENT_STAGES_MANAGE')) {
        setFetchError("You do not have permission to manage recruitment stages.");
        setIsLoading(false);
      } else {
        fetchStages();
      }
    }
  }, [sessionStatus, session, fetchStages, pathname, signIn]);

  const handleOpenModal = (stage: RecruitmentStage | null = null) => {
    setEditingStage(stage);
    form.reset(stage ? { name: stage.name, description: stage.description || '', sort_order: stage.sort_order || 0 } : { name: '', description: '', sort_order: 0 });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: StageFormValues) => {
    const url = editingStage ? `/api/settings/recruitment-stages/${editingStage.id}` : '/api/settings/recruitment-stages';
    const method = editingStage ? 'PUT' : 'POST';

    const payload = { ...data };
    if (editingStage?.is_system && editingStage.name === data.name) {
      delete (payload as any).name;
    }


    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to ${editingStage ? 'update' : 'create'} stage`);
      
      toast({ title: `Stage ${editingStage ? 'Updated' : 'Created'}`, description: `Stage "${result.name}" was successfully ${editingStage ? 'updated' : 'created'}.` });
      setIsModalOpen(false);
      fetchStages(); 
    } catch (error) {
      toast({ title: `Error ${editingStage ? 'Updating' : 'Creating'} Stage`, description: (error as Error).message, variant: "destructive" });
    }
  };

  const confirmDelete = (stage: RecruitmentStage) => {
    setStageToDelete(stage);
  };

  const handleDelete = async () => {
    if (!stageToDelete) return;
    try {
      const response = await fetch(`/api/settings/recruitment-stages/${stageToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete stage');
      }
      toast({ title: "Stage Deleted", description: `Stage "${stageToDelete.name}" has been deleted.` });
      fetchStages(); 
    } catch (error) {
      toast({ title: "Error Deleting Stage", description: (error as Error).message, variant: "destructive" });
    } finally {
      setStageToDelete(null);
    }
  };
  
  if (sessionStatus === 'loading' || (isLoading && !fetchError && stages.length === 0)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError) {
    const isPermissionError = fetchError === "You do not have permission to manage recruitment stages.";
    const isTableMissingError = fetchError.toLowerCase().includes("relation") && fetchError.toLowerCase().includes("does not exist");
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Data</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isPermissionError && (
            <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
        )}
        {isTableMissingError && (
           <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-md text-sm">
              <p className="font-semibold">It looks like the "RecruitmentStage" database table might be missing or there was an issue querying it.</p>
              <p className="mt-1">This can happen if the database initialization script (`pg-init-scripts/init-db.sql`) did not run correctly.</p>
              <p className="mt-2">Please check your Next.js server logs for specific database errors and review the PostgreSQL container logs for script execution details. Refer to `README.md` for database setup troubleshooting.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center"><KanbanSquare className="mr-3 h-6 w-6 text-primary"/>Recruitment Stages</h1>
        <Button onClick={() => handleOpenModal()} className="btn-primary-gradient">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Stage
        </Button>
      </div>
       <CardDescription>
        Manage the stages in your recruitment pipeline. System stages cannot be deleted and their names cannot be changed.
      </CardDescription>

      <Card>
        <CardContent className="pt-6">
          {stages.length === 0 && !isLoading ? (
            <p className="text-muted-foreground text-center">No recruitment stages configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Order</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((stage) => (
                  <TableRow key={stage.id}>
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">{stage.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={stage.is_system ? "secondary" : "outline"}>
                        {stage.is_system ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>{stage.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(stage)} className="mr-1 h-8 w-8">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {!stage.is_system && (
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(stage)} className="text-destructive hover:text-destructive h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Edit' : 'Add New'} Recruitment Stage</DialogTitle>
            <DialogDescription>
              {editingStage ? 'Update the details of this stage.' : 'Define a new stage for your recruitment pipeline.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register('name')} disabled={!!editingStage?.is_system} />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
               {editingStage?.is_system && <p className="text-xs text-muted-foreground mt-1">System stage names cannot be changed.</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register('description')} />
            </div>
            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input id="sort_order" type="number" {...form.register('sort_order')} />
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                {editingStage ? 'Save Changes' : 'Create Stage'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {stageToDelete && (
        <AlertDialog open={!!stageToDelete} onOpenChange={(open) => { if(!open) setStageToDelete(null);}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the stage "<strong>{stageToDelete.name}</strong>". This action cannot be undone.
                Ensure this stage is not currently in use by any candidates.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStageToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
                Delete Stage
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    
