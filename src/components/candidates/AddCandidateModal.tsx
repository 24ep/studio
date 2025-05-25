
"use client";

import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, UserPlus } from 'lucide-react';
import type { CandidateDetails, PersonalInfo, ContactInfo, EducationEntry, ExperienceEntry, SkillEntry, JobSuitableEntry, Position, CandidateStatus } from '@/lib/types';

const candidateStatusOptions: CandidateStatus[] = [
  'Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing',
  'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'
];
const experienceLevelOptionsRaw: string[] = ['entry level', 'mid level', 'senior level', 'lead', 'manager', 'executive'];
// Ensure the enum values match exactly what Zod expects for ExperienceEntry['position_level']
const experienceLevelEnumValues = experienceLevelOptionsRaw as [
    "entry level",
    "mid level",
    "senior level",
    "lead",
    "manager",
    "executive"
];


// Zod Schemas for form validation (mirroring types and API schemas)
const personalInfoFormSchema = z.object({
  title_honorific: z.string().optional(),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  nickname: z.string().optional(),
  location: z.string().optional(),
  introduction_aboutme: z.string().optional(),
});

const contactInfoFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const educationEntryFormSchema = z.object({
  major: z.string().optional(),
  field: z.string().optional(),
  period: z.string().optional(),
  duration: z.string().optional(),
  GPA: z.string().optional(),
  university: z.string().optional(),
  campus: z.string().optional(),
});

const experienceEntryFormSchema = z.object({
  company: z.string().optional(),
  position: z.string().optional(),
  description: z.string().optional(),
  period: z.string().optional(),
  duration: z.string().optional(),
  is_current_position: z.boolean().optional().default(false),
  postition_level: z.enum(experienceLevelEnumValues).optional(),
});

const skillEntryFormSchema = z.object({
  segment_skill: z.string().optional(),
  skill_string: z.string().optional(), // For comma-separated skills input
});

const jobSuitableEntryFormSchema = z.object({
  suitable_career: z.string().optional(),
  suitable_job_position: z.string().optional(),
  suitable_job_level: z.string().optional(),
  suitable_salary_bath_month: z.string().optional(),
});

// Main form schema
const addCandidateFormSchema = z.object({
  cv_language: z.string().optional(),
  personal_info: personalInfoFormSchema,
  contact_info: contactInfoFormSchema,
  education: z.array(educationEntryFormSchema).optional(),
  experience: z.array(experienceEntryFormSchema).optional(),
  skills: z.array(skillEntryFormSchema).optional(),
  job_suitable: z.array(jobSuitableEntryFormSchema).optional(),
  positionId: z.string().uuid("Position is required").nullable(),
  status: z.enum(candidateStatusOptions as [CandidateStatus, ...CandidateStatus[]]).default('Applied'),
  fitScore: z.number().min(0).max(100).optional().default(0),
});

export type AddCandidateFormValues = z.infer<typeof addCandidateFormSchema>;

interface AddCandidateModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddCandidate: (data: AddCandidateFormValues) => Promise<void>;
  availablePositions: Position[];
}

export function AddCandidateModal({ isOpen, onOpenChange, onAddCandidate, availablePositions }: AddCandidateModalProps) {
  const form = useForm<AddCandidateFormValues>({
    resolver: zodResolver(addCandidateFormSchema),
    defaultValues: {
      cv_language: '',
      personal_info: { firstname: '', lastname: '' },
      contact_info: { email: '', phone: '' },
      education: [],
      experience: [],
      skills: [{ segment_skill: '', skill_string: '' }],
      job_suitable: [{ suitable_career: '', suitable_job_position: '', suitable_job_level: '', suitable_salary_bath_month: ''}],
      positionId: null,
      status: 'Applied',
      fitScore: 0,
    },
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
    control: form.control,
    name: "experience",
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const { fields: jobSuitableFields, append: appendJobSuitable, remove: removeJobSuitable } = useFieldArray({
    control: form.control,
    name: "job_suitable",
  });


  useEffect(() => {
    if (isOpen) {
      form.reset({
        cv_language: '',
        personal_info: { firstname: '', lastname: '' },
        contact_info: { email: '', phone: '' },
        education: [],
        experience: [],
        skills: [{ segment_skill: '', skill_string: '' }],
        job_suitable: [{ suitable_career: '', suitable_job_position: '', suitable_job_level: '', suitable_salary_bath_month: ''}],
        positionId: null,
        status: 'Applied',
        fitScore: 0,
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (data: AddCandidateFormValues) => {
    const processedData = {
      ...data,
    };
    await onAddCandidate(processedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center"><UserPlus className="mr-2 h-6 w-6 text-primary" /> Add New Candidate</DialogTitle>
          <DialogDescription>
            Enter the details for the new candidate. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow overflow-hidden">
          <ScrollArea className="flex-grow overflow-y-auto p-6 pt-4">
            <div className="space-y-6">
              {/* CV Language */}
              <div>
                <Label htmlFor="cv_language">CV Language</Label>
                <Input id="cv_language" {...form.register('cv_language')} className="mt-1" />
              </div>

              {/* Personal Info */}
              <fieldset className="space-y-3 border p-4 rounded-md">
                <legend className="text-lg font-semibold">Personal Information</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="personal_info.title_honorific">Title</Label>
                    <Input id="personal_info.title_honorific" {...form.register('personal_info.title_honorific')} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="personal_info.firstname">First Name *</Label>
                    <Input id="personal_info.firstname" {...form.register('personal_info.firstname')} className="mt-1" />
                    {form.formState.errors.personal_info?.firstname && <p className="text-sm text-destructive mt-1">{form.formState.errors.personal_info.firstname.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="personal_info.lastname">Last Name *</Label>
                    <Input id="personal_info.lastname" {...form.register('personal_info.lastname')} className="mt-1" />
                     {form.formState.errors.personal_info?.lastname && <p className="text-sm text-destructive mt-1">{form.formState.errors.personal_info.lastname.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="personal_info.nickname">Nickname</Label>
                    <Input id="personal_info.nickname" {...form.register('personal_info.nickname')} className="mt-1" />
                  </div>
                </div>
                <div>
                    <Label htmlFor="personal_info.location">Location</Label>
                    <Input id="personal_info.location" {...form.register('personal_info.location')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="personal_info.introduction_aboutme">About Me</Label>
                  <Textarea id="personal_info.introduction_aboutme" {...form.register('personal_info.introduction_aboutme')} className="mt-1" />
                </div>
              </fieldset>

              {/* Contact Info */}
              <fieldset className="space-y-3 border p-4 rounded-md">
                <legend className="text-lg font-semibold">Contact Information</legend>
                <div>
                  <Label htmlFor="contact_info.email">Email *</Label>
                  <Input id="contact_info.email" type="email" {...form.register('contact_info.email')} className="mt-1" />
                  {form.formState.errors.contact_info?.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.contact_info.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="contact_info.phone">Phone</Label>
                  <Input id="contact_info.phone" type="tel" {...form.register('contact_info.phone')} className="mt-1" />
                </div>
              </fieldset>

               <fieldset className="space-y-3 border p-4 rounded-md">
                <legend className="text-lg font-semibold">Application Details</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="positionId">Applying for Position *</Label>
                        <Controller
                            name="positionId"
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                  onValueChange={(value) => field.onChange(value === "___NONE___" ? null : value)}
                                  value={field.value ?? "___NONE___"}
                                >
                                <SelectTrigger id="positionId" className="mt-1">
                                    <SelectValue placeholder="Select position or None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="___NONE___">No specific position / General Application</SelectItem>
                                    {availablePositions.map(pos => (
                                    <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.positionId && <p className="text-sm text-destructive mt-1">{form.formState.errors.positionId.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="status">Initial Status</Label>
                        <Controller
                            name="status"
                            control={form.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="status" className="mt-1">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {candidateStatusOptions.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
                <div>
                    <Label htmlFor="fitScore">Initial Fit Score (0-100)</Label>
                    <Controller
                        name="fitScore"
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                id="fitScore"
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                                className="mt-1"
                            />
                        )}
                    />
                </div>
              </fieldset>

              {/* Education */}
              <fieldset className="space-y-3 border p-4 rounded-md">
                <legend className="text-lg font-semibold">Education</legend>
                {educationFields.map((field, index) => (
                  <div key={field.id} className="p-3 border rounded-md space-y-2 relative bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="University" {...form.register(`education.${index}.university`)} />
                      <Input placeholder="Major" {...form.register(`education.${index}.major`)} />
                      <Input placeholder="Field of Study" {...form.register(`education.${index}.field`)} />
                      <Input placeholder="Campus" {...form.register(`education.${index}.campus`)} />
                      <Input placeholder="Period (e.g., 2018-2022)" {...form.register(`education.${index}.period`)} />
                      <Input placeholder="Duration (e.g., 4y)" {...form.register(`education.${index}.duration`)} />
                      <Input placeholder="GPA" {...form.register(`education.${index}.GPA`)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeEducation(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendEducation({ university: '', major: '', field: '', campus: '', period: '', duration: '', GPA: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                </Button>
              </fieldset>

              {/* Experience */}
              <fieldset className="space-y-3 border p-4 rounded-md">
                <legend className="text-lg font-semibold">Experience</legend>
                {experienceFields.map((field, index) => (
                  <div key={field.id} className="p-3 border rounded-md space-y-2 relative bg-muted/30">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input placeholder="Company" {...form.register(`experience.${index}.company`)} />
                        <Input placeholder="Position" {...form.register(`experience.${index}.position`)} />
                        <Input placeholder="Period (e.g., Jan 2022 - Present)" {...form.register(`experience.${index}.period`)} />
                        <Input placeholder="Duration (e.g., 1y6m)" {...form.register(`experience.${index}.duration`)} />
                         <Controller
                            name={`experience.${index}.postition_level`}
                            control={form.control}
                            render={({ field: controllerField }) => (
                                <Select onValueChange={controllerField.onChange} value={controllerField.value} defaultValue="">
                                <SelectTrigger><SelectValue placeholder="Position Level" /></SelectTrigger>
                                <SelectContent>
                                    {experienceLevelEnumValues.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                </SelectContent>
                                </Select>
                            )}
                        />
                        <div className="md:col-span-2 flex items-center space-x-2">
                            <Controller
                                name={`experience.${index}.is_current_position`}
                                control={form.control}
                                render={({ field: controllerField }) => (
                                    <Input
                                        type="checkbox"
                                        id={`experience.${index}.is_current_position`}
                                        checked={!!controllerField.value}
                                        onChange={e => controllerField.onChange(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                )}
                            />
                            <Label htmlFor={`experience.${index}.is_current_position`}>Current Position</Label>
                        </div>
                     </div>
                    <Textarea placeholder="Description" {...form.register(`experience.${index}.description`)} />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeExperience(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendExperience({ company: '', position: '', period: '', duration: '', is_current_position: false, description: '', postition_level: undefined })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                </Button>
              </fieldset>

                <fieldset className="space-y-3 border p-4 rounded-md">
                    <legend className="text-lg font-semibold">Skills</legend>
                    {skillFields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-md space-y-2 relative bg-muted/30">
                        <Input placeholder="Skill Segment (e.g., Programming Languages, Software)" {...form.register(`skills.${index}.segment_skill`)} />
                        <Textarea placeholder="Skills (comma-separated, e.g., Excel, Photoshop, Python)" {...form.register(`skills.${index}.skill_string`)} />
                        {skillFields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeSkill(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => appendSkill({ segment_skill: '', skill_string: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Skill Segment
                    </Button>
                </fieldset>

                <fieldset className="space-y-3 border p-4 rounded-md">
                    <legend className="text-lg font-semibold">Job Suitability</legend>
                     {jobSuitableFields.map((field, index) => (
                        <div key={field.id} className="p-3 border rounded-md space-y-2 relative bg-muted/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input placeholder="Suitable Career Path" {...form.register(`job_suitable.${index}.suitable_career`)} />
                                <Input placeholder="Suitable Job Position" {...form.register(`job_suitable.${index}.suitable_job_position`)} />
                                <Input placeholder="Suitable Job Level" {...form.register(`job_suitable.${index}.suitable_job_level`)} />
                                <Input placeholder="Desired Salary (Bath/Month)" {...form.register(`job_suitable.${index}.suitable_salary_bath_month`)} />
                            </div>
                             {jobSuitableFields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeJobSuitable(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => appendJobSuitable({ suitable_career: '', suitable_job_position: '', suitable_job_level: '', suitable_salary_bath_month: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Job Suitability Profile
                    </Button>
                </fieldset>

            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-4 sticky bottom-0 bg-card border-t z-10">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Adding Candidate...' : 'Add Candidate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


    