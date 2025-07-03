"use client";

import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card imports
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Users, Loader2, Save } from 'lucide-react';
import type { Position, Candidate } from '@/lib/types';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

// Import ReactQuill CSS
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to prevent build-time loading
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-muted animate-pulse rounded-md" />
});

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
          const result = await response.json();
          const candidates: Candidate[] = result.data || [];
          setAssociatedCandidates(candidates.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)));
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
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <div className="mt-1">
                      <ReactQuill
                        id="description-edit"
                        theme="snow"
                        value={field.value || ''}
                        onChange={(content, delta, source, editor) => {
                          if (source === 'user') {
                            field.onChange(content);
                          }
                        }}
                        className="bg-background border border-input rounded-md"
                        placeholder="Enter job description"
                        style={{ height: '200px' }}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'color': [] }, { 'background': [] }],
                            ['link'],
                            ['clean']
                          ],
                          clipboard: {
                            matchVisual: false
                          }
                        }}
                        formats={[
                          'header',
                          'bold', 'italic', 'underline', 'strike',
                          'list', 'bullet',
                          'color', 'background',
                          'link'
                        ]}
                        preserveWhitespace={true}
                      />
                      {form.formState.errors.description && (
                        <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Controller
                    name="isOpen"
                    control={form.control}
                    render={({ field }) => (
                        <Switch
                            id="is-active"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
                <Label htmlFor="is-active">Position is Open</Label>
              </div>
            </form>
          </ScrollArea>
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

