
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Users, Loader2 } from 'lucide-react';
import type { Position, Candidate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const editPositionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional().nullable(),
  isOpen: z.boolean().default(true),
  position_level: z.string().optional().nullable(),
});

export type EditPositionFormValues = z.infer<typeof editPositionFormSchema>;

interface EditPositionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEditPosition: (positionId: string, data: EditPositionFormValues) => Promise<void>;
  position: Position | null;
}

export function EditPositionModal({ isOpen, onOpenChange, onEditPosition, position }: EditPositionModalProps) {
  const { toast } = useToast();
  const [associatedCandidates, setAssociatedCandidates] = useState<Candidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  const form = useForm<EditPositionFormValues>({
    resolver: zodResolver(editPositionFormSchema),
    defaultValues: {
      title: '',
      department: '',
      description: '',
      isOpen: true,
      position_level: '',
    },
  });

  useEffect(() => {
    if (position && isOpen) {
      form.reset({
        title: position.title,
        department: position.department,
        description: position.description || '',
        isOpen: position.isOpen,
        position_level: position.position_level || '',
      });

      const fetchCandidates = async () => {
        if (!position.id) return;
        setIsLoadingCandidates(true);
        try {
          const response = await fetch(`/api/candidates?positionId=${position.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch associated candidates');
          }
          const data: Candidate[] = await response.json();
          setAssociatedCandidates(data.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)));
        } catch (error) {
          console.error("Error fetching associated candidates:", error);
          toast({ title: "Error", description: "Could not load candidates for this position.", variant: "destructive" });
          setAssociatedCandidates([]);
        } finally {
          setIsLoadingCandidates(false);
        }
      };
      fetchCandidates();

    } else if (!isOpen) {
        form.reset({ title: '', department: '', description: '', isOpen: true, position_level: '' });
        setAssociatedCandidates([]);
    }
  }, [position, isOpen, form, toast]);

  const onSubmit = async (data: EditPositionFormValues) => {
    if (!position) return;
    await onEditPosition(position.id, data);
  };
  
  if (!position && isOpen) return null; 

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset();
        setAssociatedCandidates([]);
      }
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col"> {/* Increased width */}
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" /> Edit Position: {position?.title}
          </DialogTitle>
          <DialogDescription>
            Update the details for this job position.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 flex-grow overflow-hidden py-4">
          <ScrollArea className="md:pr-3">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="title-edit">Position Title *</Label>
                <Input id="title-edit" {...form.register('title')} className="mt-1" />
                {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="department-edit">Department *</Label>
                <Input id="department-edit" {...form.register('department')} className="mt-1" />
                {form.formState.errors.department && <p className="text-sm text-destructive mt-1">{form.formState.errors.department.message}</p>}
              </div>
              <div>
                <Label htmlFor="position_level-edit">Position Level</Label>
                <Input id="position_level-edit" {...form.register('position_level')} className="mt-1" placeholder="e.g., Senior, Mid-Level, L3"/>
                {form.formState.errors.position_level && <p className="text-sm text-destructive mt-1">{form.formState.errors.position_level.message}</p>}
              </div>
              <div>
                <Label htmlFor="description-edit">Description</Label>
                <Textarea id="description-edit" {...form.register('description')} className="mt-1" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Controller
                    name="isOpen"
                    control={form.control}
                    render={({ field }) => (
                        <Switch
                            id="isOpen-edit"
                            className="switch-green"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
                <Label htmlFor="isOpen-edit">Position is Open</Label>
              </div>
            </form>
          </ScrollArea>

          <div className="border-l md:pl-3 flex flex-col">
            <h4 className="text-md font-semibold mb-2 flex items-center">
              <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Associated Candidates ({associatedCandidates.length})
            </h4>
            <ScrollArea className="flex-grow h-[300px] border rounded-md p-2 bg-muted/10">
              {isLoadingCandidates ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : associatedCandidates.length > 0 ? (
                <ul className="space-y-2">
                  {associatedCandidates.map(candidate => (
                    <li key={candidate.id} className="text-sm p-1.5 rounded hover:bg-muted/30">
                      <Link href={`/candidates/${candidate.id}`} passHref>
                        <span className="font-medium text-foreground hover:underline cursor-pointer">{candidate.name}</span>
                      </Link>
                      <p className="text-xs text-muted-foreground">{candidate.email} - Fit: {candidate.fitScore || 0}%</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No candidates currently associated with this position.</p>
              )}
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="pt-4 border-t mt-auto"> {/* Use mt-auto to push footer down */}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
