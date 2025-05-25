
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Candidate, TransitionRecord, CandidateStatus } from '@/lib/types';
import { PlusCircle, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";


const candidateStatusOptions: CandidateStatus[] = [
  'Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 
  'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'
];

// Schema for the form inside the modal (adding a new transition)
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
  // This prop will now be called by the modal to trigger the actual API update in the parent.
  // It will pass the full updated candidate object, primarily with new status and history.
  onUpdateCandidate: (updatedCandidate: Candidate) => Promise<void>; 
}

export function ManageTransitionsModal({
  candidate,
  isOpen,
  onOpenChange,
  onUpdateCandidate,
}: ManageTransitionsModalProps) {
  const { toast } = useToast();
  const form = useForm<TransitionFormValues>({
    resolver: zodResolver(transitionFormSchema),
    defaultValues: {
      newStatus: candidate?.status || 'Applied',
      notes: '',
    },
  });

  useEffect(() => {
    if (candidate && isOpen) { // Reset form when modal opens or candidate changes
      form.reset({
        newStatus: candidate.status,
        notes: '',
      });
    }
  }, [candidate, isOpen, form]);

  if (!candidate) return null;

  const onSubmit = async (data: TransitionFormValues) => {
    if (data.newStatus === candidate.status && !data.notes) {
        toast({ title: "No Change", description: "Please select a new status or add notes to create a transition.", variant: "default" });
        return;
    }

    // The API will create the TransitionRecord.
    // We just need to tell the parent component (CandidatesPage) the new status.
    // The parent will then call the PUT API.
    // For UI consistency, we can simulate the transition record locally for the history display
    // before the parent re-fetches or updates.
    
    const simulatedNewTransition: TransitionRecord = {
      id: `temp-${Date.now()}`, // Temporary ID
      date: new Date().toISOString(),
      stage: data.newStatus,
      notes: data.notes || `Status changed to ${data.newStatus}.`, // API will add its own default if notes are empty
    };

    const updatedCandidateForCallback: Candidate = {
        ...candidate,
        status: data.newStatus,
        // The actual transition history will be updated by the server response.
        // For the modal, we can optimistically add the new one for display.
        transitionHistory: [simulatedNewTransition, ...candidate.transitionHistory].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
        lastUpdateDate: new Date().toISOString(), // This will be set by server
    };
    
    try {
        // Call the prop function which will handle the API PUT request
        await onUpdateCandidate(updatedCandidateForCallback); 
        // Success toast is handled by the parent page after API call.
        // Optionally, close modal here, or let parent decide.
        // onOpenChange(false); // Often good to close after successful submission.
        form.reset({ newStatus: data.newStatus, notes: '' }); // Keep new stage selected
    } catch (error) {
        // Error toast is handled by the parent page.
        // Modal can remain open for user to retry or correct.
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Transitions for {candidate.name}</DialogTitle>
          <DialogDescription>
            Track and update the candidate's progress. Current status: <strong>{candidate.status}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Add New Transition</h3>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="newStatus">New Stage</Label>
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
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.newStatus.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any relevant notes for this transition..."
                  {...form.register('notes')}
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" /> 
                {form.formState.isSubmitting ? 'Saving...' : 'Add Transition & Update Status'}
              </Button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Transition History</h3>
            <ScrollArea className="h-[300px] border rounded-md p-3 bg-muted/50">
              {candidate.transitionHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No transition history yet.</p>
              ) : (
                <ul className="space-y-4">
                  {candidate.transitionHistory.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((record, index) => ( // ensure sorted
                    <li key={record.id}>
                      <div className="flex items-start space-x-3">
                        <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{record.stage}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(record.date), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          {record.notes && (
                            <p className="text-sm text-foreground mt-1 bg-background p-2 rounded-md border">{record.notes}</p>
                          )}
                        </div>
                      </div>
                      {index < candidate.transitionHistory.length - 1 && <Separator className="my-3" />}
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
