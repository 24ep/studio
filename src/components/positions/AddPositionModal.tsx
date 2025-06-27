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
import { Briefcase } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const addPositionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional().nullable(),
  isOpen: z.boolean().default(true),
  position_level: z.string().optional().nullable(),
});

export type AddPositionFormValues = z.infer<typeof addPositionFormSchema>;

interface AddPositionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddPosition: (data: AddPositionFormValues) => Promise<void>;
}

export function AddPositionModal({ isOpen, onOpenChange, onAddPosition }: AddPositionModalProps) {
  const [testInput, setTestInput] = useState('');
  
  const form = useForm<AddPositionFormValues>({
    resolver: zodResolver(addPositionFormSchema),
    defaultValues: {
      title: '',
      department: '',
      description: '',
      isOpen: true,
      position_level: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: '',
        department: '',
        description: '',
        isOpen: true,
        position_level: '',
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (data: AddPositionFormValues) => {
    console.log('Form submitted with data:', data);
    await onAddPosition(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-primary" /> Add New Position
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new job position.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="title-add">Position Title *</Label>
            <Input 
              id="title-add" 
              {...form.register('title')} 
              className="mt-1" 
              placeholder="Enter position title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="department-add">Department *</Label>
            <Input 
              id="department-add" 
              {...form.register('department')} 
              className="mt-1" 
              placeholder="Enter department name"
            />
            {form.formState.errors.department && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.department.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="position_level-add">Position Level</Label>
            <Input 
              id="position_level-add" 
              {...form.register('position_level')} 
              className="mt-1" 
              placeholder="e.g., Senior, Mid-Level, L3"
            />
            {form.formState.errors.position_level && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.position_level.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="description-add">Job Description</Label>
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <ReactQuill
                  id="description-add"
                  theme="snow"
                  value={field.value || ''}
                  onChange={field.onChange}
                  className="mt-1 bg-white"
                  placeholder="Enter job description"
                  style={{ minHeight: 300 }}
                />
              )}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Controller
              name="isOpen"
              control={form.control}
              render={({ field }) => (
                <Toggle
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isOpen-add">Position is Open</Label>
          </div>
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting} className="btn-primary-gradient">
              {form.formState.isSubmitting ? 'Adding Position...' : 'Add Position'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

