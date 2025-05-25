
"use client";

import { useState, useEffect } from 'react';
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
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Candidate, TransitionRecord, CandidateStatus } from '@/lib/types';
import { PlusCircle, CalendarDays, Edit3, Trash2, Save, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";


const candidateStatusOptions: CandidateStatus[] = [
  'Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 
  'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'
];

const transitionFormSchema = z.object({
  newStatus: z.custom<CandidateStatus>((val) => candidateStatusOptions.includes(val as CandidateStatus), {
    message: "Invalid status selected",
  }),
  notes: z.string().optional(),
});

type TransitionFormValues = z.infer<typeof transitionFormSchema>;

interface ManageTransitionsModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateCandidate: (candidateId: string, status: CandidateStatus, newTransitionHistory?: TransitionRecord[]) => Promise<void>; 
  onRefreshCandidateData: (candidateId: string) => Promise<void>; // To refresh after note edit/delete
}

export function ManageTransitionsModal({
  candidate,
  isOpen,
  onOpenChange,
  onUpdateCandidate,
  onRefreshCandidateData,
}: ManageTransitionsModalProps) {
  const { toast } = useToast();
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [transitionToDelete, setTransitionToDelete] = useState<TransitionRecord | null>(null);

  const form = useForm<TransitionFormValues>({
    resolver: zodResolver(transitionFormSchema),
    defaultValues: {
      newStatus: candidate?.status || 'Applied',
      notes: '',
    },
  });

  useEffect(() => {
    if (candidate && isOpen) {
      form.reset({
        newStatus: candidate.status,
        notes: '',
      });
      setEditingTransitionId(null); // Reset editing state
    }
  }, [candidate, isOpen, form]);

  if (!candidate) return null;

  const handleAddTransitionSubmit = async (data: TransitionFormValues) => {
    if (data.newStatus === candidate.status && !data.notes?.trim()) {
        toast({ title: "No Change", description: "Please select a new status or add notes to create a transition.", variant: "default" });
        return;
    }
    try {
        await onUpdateCandidate(candidate.id, data.newStatus, [{ 
            id: `temp-${Date.now()}`, 
            date: new Date().toISOString(), 
            stage: data.newStatus, 
            notes: data.notes || `Status changed to ${data.newStatus}.`
        }]);
        form.reset({ newStatus: data.newStatus, notes: '' });
        // Candidate data will be refreshed by parent via onUpdateCandidate
    } catch (error) {
        // Error handled by parent
    }
  };

  const handleEditNotesClick = (transition: TransitionRecord) => {
    setEditingTransitionId(transition.id);
    setEditingNotes(transition.notes || '');
  };

  const handleSaveNotes = async (transitionId: string) => {
    try {
      const response = await fetch(`/api/transitions/${transitionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editingNotes }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to update notes: ${response.statusText}`);
      }
      toast({ title: "Notes Updated", description: "Transition notes have been successfully updated." });
      setEditingTransitionId(null);
      onRefreshCandidateData(candidate.id); // Refresh data in parent
    } catch (error) {
      toast({ title: "Error Updating Notes", description: (error as Error).message, variant: "destructive" });
    }
  };

  const confirmDeleteTransition = (transition: TransitionRecord) => {
    setTransitionToDelete(transition);
  };

  const handleDeleteTransition = async () => {
    if (!transitionToDelete) return;
    try {
      const response = await fetch(`/api/transitions/${transitionToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to delete transition: ${response.statusText}`);
      }
      toast({ title: "Transition Deleted", description: "The transition record has been successfully deleted." });
      onRefreshCandidateData(candidate.id); // Refresh data in parent
    } catch (error) {
      toast({ title: "Error Deleting Transition", description: (error as Error).message, variant: "destructive" });
    } finally {
      setTransitionToDelete(null);
    }
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setEditingTransitionId(null); // Clear editing state when modal closes
      }}>
        <DialogContent className="sm:max-w-3xl"> {/* Adjusted for potentially wider content */}
          <DialogHeader>
            <DialogTitle>Manage Transitions for {candidate.name}</DialogTitle>
            <DialogDescription>
              Track and update the candidate's progress. Current status: <strong>{candidate.status}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
            {/* Add New Transition Form */}
            <div className="md:border-r md:pr-6">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Add New Transition</h3>
              <form onSubmit={form.handleSubmit(handleAddTransitionSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="newStatus" className="text-sm font-medium text-muted-foreground">New Stage</Label>
                  <Controller
                    name="newStatus"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={candidate.status}>
                        <SelectTrigger id="newStatus" className="mt-1">
                          <SelectValue placeholder="Select new stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidateStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.newStatus && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.newStatus.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any relevant notes for this transition..."
                    {...form.register('notes')}
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <Button type="submit" className="w-full btn-primary-gradient" disabled={form.formState.isSubmitting}>
                  <PlusCircle className="mr-2 h-4 w-4" /> 
                  {form.formState.isSubmitting ? 'Saving...' : 'Add Transition & Update Status'}
                </Button>
              </form>
            </div>

            {/* Transition History */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Transition History</h3>
              <ScrollArea className="h-[350px] border rounded-md p-1 bg-muted/30">
                {candidate.transitionHistory && candidate.transitionHistory.length > 0 ? (
                  <ul className="space-y-0">
                    {candidate.transitionHistory.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((record, index) => (
                      <li key={record.id} className="p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <CalendarDays className="h-4 w-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{record.stage}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(record.date), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {editingTransitionId === record.id ? (
                              <div className="mt-2 space-y-2">
                                <Textarea 
                                  value={editingNotes} 
                                  onChange={(e) => setEditingNotes(e.target.value)} 
                                  className="text-sm min-h-[60px]"
                                  placeholder="Edit notes..."
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveNotes(record.id)}><Save className="h-3.5 w-3.5 mr-1"/> Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingTransitionId(null)}><X className="h-3.5 w-3.5 mr-1"/> Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              record.notes && (
                                <p className="text-sm text-foreground mt-1.5 whitespace-pre-wrap">{record.notes}</p>
                              )
                            )}
                          </div>
                        </div>
                        {editingTransitionId !== record.id && (
                          <div className="flex justify-end gap-1 mt-1.5">
                            <Button variant="ghost" size="sm" className="h-7 px-2 py-1 text-xs" onClick={() => handleEditNotesClick(record)}>
                              <Edit3 className="h-3.5 w-3.5 mr-1"/> Edit Notes
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 py-1 text-xs text-destructive hover:text-destructive" onClick={() => confirmDeleteTransition(record)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1"/> Delete
                            </Button>
                          </div>
                        )}
                         {index < candidate.transitionHistory.length - 1 && <Separator className="my-3" />}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-10">No transition history yet.</p>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {transitionToDelete && (
        <AlertDialog open={!!transitionToDelete} onOpenChange={(open) => { if(!open) setTransitionToDelete(null);}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this transition record?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Deleting this transition for stage "<strong>{transitionToDelete.stage}</strong>" (dated {format(parseISO(transitionToDelete.date), "MMM d, yyyy")}) will permanently remove it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTransitionToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTransition} className={buttonVariants({ variant: "destructive" })}>
                Delete Transition
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
