
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

const transitionFormSchema = z.object({
  stage: z.custom<CandidateStatus>((val) => candidateStatusOptions.includes(val as CandidateStatus), {
    message: "Invalid status selected",
  }),
  notes: z.string().optional(),
});

type TransitionFormValues = z.infer<typeof transitionFormSchema>;

interface ManageTransitionsModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateCandidate: (updatedCandidate: Candidate) => void;
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
      stage: candidate?.status || 'Applied',
      notes: '',
    },
  });

  useEffect(() => {
    if (candidate) {
      form.reset({
        stage: candidate.status,
        notes: '',
      });
    }
  }, [candidate, form]);

  if (!candidate) return null;

  const onSubmit = (data: TransitionFormValues) => {
    const newTransition: TransitionRecord = {
      id: `trans-${Date.now()}`,
      date: new Date().toISOString(),
      stage: data.stage,
      notes: data.notes,
    };

    const updatedCandidate: Candidate = {
      ...candidate,
      status: data.stage,
      transitionHistory: [...candidate.transitionHistory, newTransition].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
      lastUpdateDate: new Date().toISOString(),
    };
    onUpdateCandidate(updatedCandidate);
    toast({
      title: "Transition Added",
      description: `${candidate.name}'s status updated to ${data.stage}.`,
    });
    form.reset({ stage: data.stage, notes: ''}); // Keep current stage selected for next potential note
    // onOpenChange(false); // Optionally close modal, or keep open to add more
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Transitions for {candidate.name}</DialogTitle>
          <DialogDescription>
            Track and update the candidate's progress through the hiring pipeline. Current status: <strong>{candidate.status}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Add New Transition</h3>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="stage">New Stage</Label>
                <Controller
                  name="stage"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="stage" className="mt-1">
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
                 {form.formState.errors.stage && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.stage.message}</p>
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
              <Button type="submit" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Transition
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
                  {candidate.transitionHistory.map((record, index) => (
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
