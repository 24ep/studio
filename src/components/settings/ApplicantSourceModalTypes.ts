import * as z from 'zod';
import type { ApplicantSource } from '@/lib/types';

export const applicantSourceFormSchema = z.object({
  name: z.string().min(1, "Source name is required"),
  description: z.string().optional(),
  email: z.string().optional(),
  allowSubSource: z.boolean().default(false),
  sortOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().default(true),
  logo: z.custom<File>(
    (value) => value === undefined || (typeof File !== 'undefined' && value instanceof File),
    'Logo must be an image file'
  ).optional(),
});

export type ApplicantSourceFormValues = z.infer<typeof applicantSourceFormSchema>;

export interface ApplicantSourceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicantSourceFormValues) => Promise<void>;
  source?: ApplicantSource | null;
}

export function getApplicantSourceFormDefaults(source?: ApplicantSource | null): ApplicantSourceFormValues {
  return {
    name: source?.name || '',
    description: source?.description || '',
    email: source?.email || '',
    allowSubSource: source?.allowSubSource || false,
    sortOrder: source?.sortOrder || 0,
    isActive: source?.isActive ?? true,
  };
}

export function getApplicantSourceLogoPreview(source?: ApplicantSource | null) {
  return source?.logo || null;
}

export function getApplicantSourceDialogCopy(source?: ApplicantSource | null) {
  return source
    ? {
        title: 'Edit Applicant Source',
        description: 'Update the Applicant source settings below.',
        submitLabel: 'Update',
      }
    : {
        title: 'Create Applicant Source',
        description: 'Create a new Applicant source to track where Applicants come from.',
        submitLabel: 'Create',
      };
}
