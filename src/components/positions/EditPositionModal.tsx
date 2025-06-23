"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card imports
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Users, Loader2, Save } from 'lucide-react';
import type { Position, Candidate } from '@/lib/types';
import { toast } from 'react-hot-toast';
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch associated candidates');
          }
          const data: Candidate[] = await response.json();
          setAssociatedCandidates(data.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)));
        } catch (error) {
          console.error("Error fetching associated candidates:", error);
          toast.error((error as Error).message || "Could not load candidates for this position.");
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
  }, [position, isOpen, form]);

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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0"> {/* Changed p-0 to allow cards to manage padding */}
        <DialogHeader className="p-6 pb-4 border-b"> {/* Added padding and border */}
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" /> Edit Position: {position?.title}
          </DialogTitle>
          <DialogDescription>
            Update the details for this job position.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 flex-grow overflow-hidden p-6"> {/* Main content area with padding */}
          {/* Left Column: Form */}
          <ScrollArea className="h-full"> {/* Ensure ScrollArea takes full height of its container */}
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
                <Label htmlFor="description-edit">Job Description</Label>
                <Textarea id="description-edit" {...form.register('description')} className="mt-1" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Controller
                    name="isOpen"
                    control={form.control}
                    render={({ field }) => (
                        <Toggle
                            id="isOpen-edit"
                            variant="success"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
                <Label htmlFor="isOpen-edit">Position is Open</Label>
              </div>
            </form>
          </ScrollArea>

          {/* Right Column: Associated Candidates in a Card */}
          <div className="flex flex-col h-full"> {/* Container for the card to manage its height */}
            <Card className="flex-grow flex flex-col overflow-hidden shadow-md">
              <CardHeader className="p-4">
                <CardTitle className="text-base flex items-center"> {/* Adjusted text size */}
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" /> Associated Candidates ({associatedCandidates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-grow overflow-hidden">
                <ScrollArea className="h-full"> {/* ScrollArea takes full height of CardContent */}
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
                          <p className="text-xs text-muted-foreground">{candidate.email} - Fit: {(candidate.fitScore || 0)}%</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No candidates currently associated with this position.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t mt-auto"> {/* Added padding */}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting} className="btn-primary-gradient">
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

