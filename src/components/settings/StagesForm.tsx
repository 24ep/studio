import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { RecruitmentStageRow } from './recruitment-stage-ui-types';
import { isSystemRecruitmentStage } from '@/lib/recruitment-stage-system-shared';

const stageFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().optional().default(0),
  color_complete: z.string().optional().nullable(), // Add color_complete field
  color_badge: z.string().optional().nullable(), // Add badge color field
});
type StageFormValues = z.infer<typeof stageFormSchema>;

interface StagesFormProps {
  open: boolean;
  stage: RecruitmentStageRow | null;
  onClose: () => void;
  onSubmit: (data: StageFormValues) => void;
}

const StagesForm: React.FC<StagesFormProps> = ({ open, stage, onClose, onSubmit }) => {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<StageFormValues>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: { name: '', description: '', sort_order: 0, color_complete: '#3B82F6', color_badge: '#3B82F6' },
  });

  const isProtectedStage = Boolean(stage && isSystemRecruitmentStage(stage));

  useEffect(() => {
    if (stage) {
      reset({
        name: stage.name || '',
        description: stage.description || '',
        sort_order: stage.sort_order || 0,
        color_complete: stage.color_complete || '',
        color_badge: stage.color_badge || '',
      });
    } else {
      reset({ name: '', description: '', sort_order: 0, color_complete: '', color_badge: '' });
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
            <Input 
              {...register('name')} 
              placeholder="Stage name" 
              disabled={isSubmitting || isProtectedStage} 
            />
            {isProtectedStage && (
              <div className="text-xs text-muted-foreground mt-1">
                This stage name cannot be changed as it is used for core system functionality.
              </div>
            )}
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
          <div>
            <label className="block font-medium mb-1">Complete Color</label>
            <Controller
              name="color_complete"
              control={control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value || '#3B82F6'}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  className="w-full"
                />
              )}
            />
            {errors.color_complete && <div className="text-destructive text-xs mt-1">{errors.color_complete.message}</div>}
          </div>
          <div>
            <label className="block font-medium mb-1">Badge Color</label>
            <Controller
              name="color_badge"
              control={control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value || '#3B82F6'}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  className="w-full"
                />
              )}
            />
            {errors.color_badge && <div className="text-destructive text-xs mt-1">{errors.color_badge.message}</div>}
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
