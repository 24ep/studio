import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const stageFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().optional().default(0),
});
type StageFormValues = z.infer<typeof stageFormSchema>;

interface StagesFormProps {
  open: boolean;
  stage: any;
  onClose: () => void;
  onSubmit: (data: StageFormValues) => void;
}

const StagesForm: React.FC<StagesFormProps> = ({ open, stage, onClose, onSubmit }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StageFormValues>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: { name: '', description: '', sort_order: 0 },
  });

  useEffect(() => {
    if (stage) {
      reset({
        name: stage.name || '',
        description: stage.description || '',
        sort_order: stage.sort_order || 0,
      });
    } else {
      reset({ name: '', description: '', sort_order: 0 });
    }
  }, [stage, reset]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{stage ? 'Edit Stage' : 'Add New Stage'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Name<span className="text-destructive">*</span></label>
            <Input {...register('name')} placeholder="Stage name" disabled={isSubmitting} />
            {errors.name && <div className="text-destructive text-xs mt-1">{errors.name.message}</div>}
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <Textarea {...register('description')} placeholder="Description (optional)" disabled={isSubmitting} />
            {errors.description && <div className="text-destructive text-xs mt-1">{errors.description.message}</div>}
          </div>
          <div>
            <label className="block font-medium mb-1">Sort Order</label>
            <Input type="number" {...register('sort_order', { valueAsNumber: true })} placeholder="0" disabled={isSubmitting} />
            {errors.sort_order && <div className="text-destructive text-xs mt-1">{errors.sort_order.message}</div>}
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>{stage ? 'Save Changes' : 'Add Stage'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StagesForm; 