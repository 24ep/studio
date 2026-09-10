"use client";

import { useEffect, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClickProtection } from '@/hooks/use-click-protection';
import {
  ApplicantSourceFormFields,
  ApplicantSourceModalFooter,
} from './ApplicantSourceModalParts';
import {
  applicantSourceFormSchema,
  getApplicantSourceDialogCopy,
  getApplicantSourceFormDefaults,
  getApplicantSourceLogoPreview,
  type ApplicantSourceFormValues,
  type ApplicantSourceModalProps,
} from './ApplicantSourceModalTypes';

export default function ApplicantSourceModal({
  open,
  onClose,
  onSubmit,
  source,
}: ApplicantSourceModalProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const copy = getApplicantSourceDialogCopy(source);

  const { isActioning, handleProtectedAsyncClick } = useClickProtection({
    actionName: 'Applicant source',
    debounceMs: 200,
    timeoutMs: 500,
  });

  const form = useForm<ApplicantSourceFormValues>({
    resolver: zodResolver(applicantSourceFormSchema),
    defaultValues: getApplicantSourceFormDefaults(),
  });

  useEffect(() => {
    form.reset(getApplicantSourceFormDefaults(source));
    setLogoPreview(getApplicantSourceLogoPreview(source));
  }, [source, form, open]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setLogoPreview(String(readerEvent.target?.result || ''));
    };
    reader.readAsDataURL(file);
    form.setValue('logo', file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    form.setValue('logo', undefined);
  };

  const handleSubmit = async (data: ApplicantSourceFormValues) => {
    await handleProtectedAsyncClick(async () => {
      try {
        setIsUploading(true);
        await onSubmit(data);
        onClose();
      } catch (error) {
        console.error('Failed to submit:', error);
      } finally {
        setIsUploading(false);
      }
    });
  };

  const isSubmitting = form.formState.isSubmitting || isUploading || isActioning;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pr-4">
            <ApplicantSourceFormFields
              form={form}
              logoPreview={logoPreview}
              onLogoChange={handleLogoChange}
              onRemoveLogo={removeLogo}
            />
          </form>
        </ScrollArea>

        <ApplicantSourceModalFooter
          disabled={isSubmitting}
          isSubmitting={isSubmitting}
          submitLabel={copy.submitLabel}
          onSubmit={form.handleSubmit(handleSubmit)}
        />
      </DialogContent>
    </Dialog>
  );
}
