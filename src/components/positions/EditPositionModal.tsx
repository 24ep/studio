
"use client";

import { useEffect } from 'react';
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
import { Edit3 } from 'lucide-react';
import type { Position } from '@/lib/types';

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
    } else if (!isOpen) {
        form.reset({ title: '', department: '', description: '', isOpen: true, position_level: '' });
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
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" /> Edit Position: {position?.title}
          </DialogTitle>
          <DialogDescription>
            Update the details for this job position.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
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
          <div className="flex items-center space-x-2">
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
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
