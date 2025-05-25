
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
import { Briefcase } from 'lucide-react';
import type { Position } from '@/lib/types';

const addPositionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  isOpen: z.boolean().default(true),
});

export type AddPositionFormValues = z.infer<typeof addPositionFormSchema>;

interface AddPositionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddPosition: (data: AddPositionFormValues) => Promise<void>;
}

export function AddPositionModal({ isOpen, onOpenChange, onAddPosition }: AddPositionModalProps) {
  const form = useForm<AddPositionFormValues>({
    resolver: zodResolver(addPositionFormSchema),
    defaultValues: {
      title: '',
      department: '',
      description: '',
      isOpen: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: '',
        department: '',
        description: '',
        isOpen: true,
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (data: AddPositionFormValues) => {
    await onAddPosition(data);
  };

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
            <Briefcase className="mr-2 h-5 w-5 text-primary" /> Add New Position
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new job position.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="title-add">Position Title *</Label>
            <Input id="title-add" {...form.register('title')} className="mt-1" />
            {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="department-add">Department *</Label>
            <Input id="department-add" {...form.register('department')} className="mt-1" />
            {form.formState.errors.department && <p className="text-sm text-destructive mt-1">{form.formState.errors.department.message}</p>}
          </div>
          <div>
            <Label htmlFor="description-add">Description</Label>
            <Textarea id="description-add" {...form.register('description')} className="mt-1" />
          </div>
          <div className="flex items-center space-x-2">
            <Controller
                name="isOpen"
                control={form.control}
                render={({ field }) => (
                    <Switch
                        id="isOpen-add"
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Adding Position...' : 'Add Position'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
