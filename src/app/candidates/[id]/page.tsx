
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Candidate, CandidateDetails, TransitionRecord, EducationEntry, ExperienceEntry, SkillEntry, JobSuitableEntry, PersonalInfo, N8NJobMatch, UserProfile, Position } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Briefcase, CalendarDays, DollarSign, Edit, GraduationCap, HardDrive, Info, LinkIcon, ListChecks, Loader2, Mail, MapPin, MessageSquare, Percent, Phone, ServerCrash, ShieldAlert, Star, Tag, UploadCloud, User, UserCircle, UserCog, Users, Zap, ExternalLink, Edit3, Save, X } from 'lucide-react';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal';
import { ManageTransitionsModal } from '@/components/candidates/ManageTransitionsModal';
import { EditPositionModal, type EditPositionFormValues } from '@/components/positions/EditPositionModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';


const getStatusBadgeVariant = (status: Candidate['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Hired': case 'Offer Accepted': return 'default';
    case 'Interview Scheduled': case 'Interviewing': case 'Offer Extended': return 'secondary';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

// Zod schema for editing candidate details - fields are optional
const personalInfoEditSchema = z.object({
  title_honorific: z.string().optional(),
  firstname: z.string().min(1, "First name is required").optional(),
  lastname: z.string().min(1, "Last name is required").optional(),
  nickname: z.string().optional(),
  location: z.string().optional(),
  introduction_aboutme: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
}).deepPartial();

const contactInfoEditSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
}).deepPartial();

const educationEntryEditSchema = z.object({
    id: z.string().optional(), // Assuming existing entries have IDs
    major: z.string().optional(),
    field: z.string().optional(),
    period: z.string().optional(),
    duration: z.string().optional(),
    GPA: z.string().optional(),
    university: z.string().optional(),
    campus: z.string().optional(),
}).deepPartial();

const experienceEntryEditSchema = z.object({
    id: z.string().optional(),
    company: z.string().optional(),
    position: z.string().optional(),
    description: z.string().optional(),
    period: z.string().optional(),
    duration: z.string().optional(),
    is_current_position: z.boolean().optional(),
    postition_level: z.string().optional(),
}).deepPartial();

const skillEntryEditSchema = z.object({
    id: z.string().optional(),
    segment_skill: z.string().optional(),
    skill_string: z.string().optional(), // For comma-separated skills
    skill: z.array(z.string()).optional(), // To hold the array of skills after processing
}).deepPartial();

const jobSuitableEntryEditSchema = z.object({
    id: z.string().optional(),
    suitable_career: z.string().optional(),
    suitable_job_position: z.string().optional(),
    suitable_job_level: z.string().optional(),
    suitable_salary_bath_month: z.string().optional(),
}).deepPartial();

const candidateDetailsEditSchema = z.object({
  cv_language: z.string().optional(),
  personal_info: personalInfoEditSchema.optional(),
  contact_info: contactInfoEditSchema.optional(),
  education: z.array(educationEntryEditSchema).optional(),
  experience: z.array(experienceEntryEditSchema).optional(),
  skills: z.array(skillEntryEditSchema).optional(),
  job_suitable: z.array(jobSuitableEntryEditSchema).optional(),
  // job_matches and associatedMatchDetails are typically read-only from n8n
}).deepPartial();

const editCandidateDetailSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().nullable().optional(),
  recruiterId: z.string().uuid().nullable().optional(), 
  fitScore: z.number().min(0).max(100).optional(),
  status: z.enum(['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'] as [string, ...string[]]).optional(),
  parsedData: candidateDetailsEditSchema.optional(),
});

type EditCandidateFormValues = z.infer<typeof editCandidateDetailSchema>;


export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [recruiters, setRecruiters] = useState<Pick<UserProfile, 'id' | 'name'>[]>([]);
  const [isAssigningRecruiter, setIsAssigningRecruiter] = useState(false);

  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTransitionsModalOpen, setIsTransitionsModalOpen] = useState(false);

  const [allDbPositions, setAllDbPositions] = useState<Position[]>([]);
  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<EditCandidateFormValues>({
    resolver: zodResolver(editCandidateDetailSchema),
    defaultValues: {},
  });

  const { control, register, handleSubmit, reset, setValue, watch } = form;

  const educationFieldArray = useFieldArray({ control, name: "parsedData.education" });
  const experienceFieldArray = useFieldArray({ control, name: "parsedData.experience" });
  const skillsFieldArray = useFieldArray({ control, name: "parsedData.skills" });
  const jobSuitableFieldArray = useFieldArray({ control, name: "parsedData.job_suitable" });


  const fetchCandidateDetails = useCallback(async () => {
    if (!candidateId) return;
    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);

    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Failed to fetch candidate: ${response.statusText || `Status ${response.status}`}`;
        setFetchError(errorMessage);
        setCandidate(null);
        return;
      }
      const data: Candidate = await response.json();
      setCandidate(data);
      // Reset form with fetched data
      reset({
        name: data.name,
        email: data.email,
        phone: data.phone,
        positionId: data.positionId,
        recruiterId: data.recruiterId,
        fitScore: data.fitScore,
        status: data.status,
        parsedData: {
            ...(data.parsedData as CandidateDetails),
            skills: (data.parsedData as CandidateDetails)?.skills?.map(s => ({
                ...s,
                skill_string: s.skill?.join(', ') || ''
            })) || []
        }
      });
    } catch (error) {
      console.error("Error fetching candidate details:", error);
      setFetchError((error as Error).message || "Could not load candidate data.");
      setCandidate(null);
    } finally {
      setIsLoading(false);
    }
  }, [candidateId, reset]);

  const fetchRecruiters = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return; 
    try {
      const response = await fetch('/api/users?role=Recruiter');
      if (!response.ok) throw new Error('Failed to fetch recruiters');
      const data: UserProfile[] = await response.json();
      setRecruiters(data.map(r => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      toast({ title: "Error", description: "Could not load recruiters for assignment.", variant: "destructive" });
    }
  }, [sessionStatus, toast]);

  const fetchAllPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/positions?isOpen=true');
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data: Position[] = await response.json();
      setAllDbPositions(data);
    } catch (error) {
      console.error("Error fetching all positions:", error);
    }
  }, []);


  useEffect(() => {
    if (candidateId) {
      fetchCandidateDetails();
      fetchAllPositions();
      if (sessionStatus === 'authenticated' && (session?.user?.role === 'Admin' || session?.user?.role === 'Recruiter')) {
         fetchRecruiters();
      }
    }
  }, [candidateId, sessionStatus, session, fetchCandidateDetails, fetchRecruiters, fetchAllPositions]);

  const handleUploadSuccess = (updatedCandidate: Candidate) => {
    setCandidate(updatedCandidate);
    reset({ // Reset form with updated data
        name: updatedCandidate.name,
        email: updatedCandidate.email,
        phone: updatedCandidate.phone,
        positionId: updatedCandidate.positionId,
        recruiterId: updatedCandidate.recruiterId,
        fitScore: updatedCandidate.fitScore,
        status: updatedCandidate.status,
        parsedData: {
          ...(updatedCandidate.parsedData as CandidateDetails),
          skills: (updatedCandidate.parsedData as CandidateDetails)?.skills?.map(s => ({
            ...s,
            skill_string: s.skill?.join(', ') || ''
          })) || []
        }
    });
    setIsUploadModalOpen(false);
    toast({ title: "Resume Uploaded", description: "Resume successfully updated." });
  };

  const handleUpdateCandidateStatus = async (id: string, newStatus: Candidate['status']) => {
    try {
        const response = await fetch(`/api/candidates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
            throw new Error(errorData.message || `Failed to update candidate status: ${response.statusText}`);
        }
        await fetchCandidateDetails(); // Refetch details to get updated history
        toast({ title: "Status Updated", description: `Candidate status updated to ${newStatus}.` });
    } catch (error) {
        toast({
            title: "Error Updating Status",
            description: (error as Error).message || "Could not update candidate status.",
            variant: "destructive",
        });
    }
  };

  const handleAssignRecruiter = async (newRecruiterId: string | null) => {
    if (!candidate || isAssigningRecruiter) return;
    setIsAssigningRecruiter(true);
    try {
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterId: newRecruiterId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to assign recruiter: ${response.statusText}`);
      }
      const updatedCandidate: Candidate = await response.json();
      setCandidate(updatedCandidate);
      reset({ // Reset form with updated data
        name: updatedCandidate.name,
        email: updatedCandidate.email,
        phone: updatedCandidate.phone,
        positionId: updatedCandidate.positionId,
        recruiterId: updatedCandidate.recruiterId,
        fitScore: updatedCandidate.fitScore,
        status: updatedCandidate.status,
        parsedData: {
          ...(updatedCandidate.parsedData as CandidateDetails),
          skills: (updatedCandidate.parsedData as CandidateDetails)?.skills?.map(s => ({
            ...s,
            skill_string: s.skill?.join(', ') || ''
          })) || []
        }
      });
      toast({ title: "Recruiter Assigned", description: `Candidate assigned to ${updatedCandidate.recruiter?.name || 'Unassigned'}.` });
    } catch (error) {
      toast({ title: "Error Assigning Recruiter", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsAssigningRecruiter(false);
    }
  };

  const handleN8nJobMatchClick = (n8nMatchTitle: string) => {
    const matchedPosition = allDbPositions.find(p => p.title.toLowerCase() === n8nMatchTitle.toLowerCase());
    if (matchedPosition) {
      setSelectedPositionForEdit(matchedPosition);
      setIsEditPositionModalOpen(true);
    } else {
      toast({ title: "Position Not Found", description: `Position "${n8nMatchTitle}" not found in the system.`, variant: "default" });
    }
  };

  const handlePositionEdited = async () => {
    toast({ title: "Position Updated", description: "Position details have been saved." });
    setIsEditPositionModalOpen(false);
    await fetchAllPositions(); // Refresh position list for n8n matching
    if (candidateId) {
        await fetchCandidateDetails(); 
    }
  };

  const handleSaveDetails = async (data: EditCandidateFormValues) => {
    if (!candidate) return;

    // Process skills string back into array
    const processedData = {
        ...data,
        parsedData: {
            ...data.parsedData,
            skills: data.parsedData?.skills?.map(s => ({
                ...s,
                skill: s.skill_string?.split(',').map(sk => sk.trim()).filter(sk => sk) || []
            }))
        }
    };
    // Remove skill_string if you don't want to save it
    processedData.parsedData?.skills?.forEach(s => delete (s as any).skill_string);


    try {
        const response = await fetch(`/api/candidates/${candidate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(processedData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
            throw new Error(errorData.message || `Failed to update candidate: ${response.statusText}`);
        }
        await fetchCandidateDetails(); // Refetch to get latest data
        setIsEditing(false);
        toast({ title: "Details Saved", description: "Candidate details updated successfully." });
    } catch (error) {
        toast({ title: "Error Saving Details", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleCancelEdit = () => {
    if (candidate) {
        reset({ // Reset form to original candidate data
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            positionId: candidate.positionId,
            recruiterId: candidate.recruiterId,
            fitScore: candidate.fitScore,
            status: candidate.status,
            parsedData: {
                ...(candidate.parsedData as CandidateDetails),
                skills: (candidate.parsedData as CandidateDetails)?.skills?.map(s => ({
                    ...s,
                    skill_string: s.skill?.join(', ') || ''
                })) || []
            }
        });
    }
    setIsEditing(false);
  };


  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-6">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Candidate</h2>
        <p className="text-muted-foreground mb-6">{fetchError}</p>
        <Button onClick={fetchCandidateDetails}>Try Again</Button>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-6">
        <UserCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Candidate Not Found</h2>
        <p className="text-muted-foreground">The requested candidate could not be found.</p>
        <Button onClick={() => router.push('/candidates')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Candidates
        </Button>
      </div>
    );
  }

  const parsed = candidate.parsedData as CandidateDetails | null;
  const canManageCandidate = session?.user?.role === 'Admin' || session?.user?.role === 'Recruiter';

  const renderField = (label: string, value?: string | number | null, icon?: React.ElementType, isLink?: boolean, linkHref?: string, linkTarget?: string) => {
    if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))) return null;
    const IconComponent = icon;
    const content = isLink ? (
      <a href={linkHref} target={linkTarget} rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined} className="text-primary hover:underline cursor-pointer break-all">
        {String(value)}
      </a>
    ) : (
      <span className="text-foreground break-words">{String(value)}</span>
    );
    return (
      <div className="flex items-start text-sm py-1">
        {IconComponent && <IconComponent className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />}
        <span className="font-medium text-muted-foreground mr-1 w-32 shrink-0">{label}:</span>
        {content}
      </div>
    );
  };
  
  const MINIO_PUBLIC_BASE_URL = `http://localhost:9847`;
  const MINIO_BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET_NAME || "canditrack-resumes";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={() => router.push('/candidates')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Candidates
        </Button>
        {canManageCandidate && !isEditing && (
            <Button onClick={() => setIsEditing(true)}><Edit3 className="mr-2 h-4 w-4"/> Edit Details</Button>
        )}
        {isEditing && (
            <div className="flex gap-2">
                <Button onClick={handleSubmit(handleSaveDetails)} variant="default" className="btn-primary-gradient">
                    <Save className="mr-2 h-4 w-4"/> Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="mr-2 h-4 w-4"/> Cancel
                </Button>
            </div>
        )}
      </div>
    <form onSubmit={handleSubmit(handleSaveDetails)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Candidate Info Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarImage src={(parsed?.personal_info as PersonalInfo)?.avatar_url || `https://placehold.co/80x80.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar" />
                  <AvatarFallback className="text-3xl">{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  {isEditing ? (
                    <>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" {...register('name')} className="text-3xl font-bold" />
                      {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                      
                      <Label htmlFor="email" className="mt-1 block">Email</Label>
                      <Input id="email" {...register('email')} />
                      {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}

                      <Label htmlFor="phone" className="mt-1 block">Phone</Label>
                      <Input id="phone" {...register('phone')} />
                    </>
                  ) : (
                    <>
                      <CardTitle className="text-3xl">{candidate.name}</CardTitle>
                      {renderField("Email", candidate.email, Mail)}
                      {renderField("Phone", candidate.phone, Phone)}
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 {isEditing ? (
                    <>
                        <Label htmlFor="status">Status</Label>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="text-base px-3 py-1 capitalize"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'].map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <Label htmlFor="fitScore" className="mt-1">Fit Score</Label>
                        <Input id="fitScore" type="number" {...register('fitScore', { valueAsNumber: true })} className="w-32 text-right" />

                    </>
                  ) : (
                    <>
                        <Badge variant={getStatusBadgeVariant(candidate.status)} className="text-base px-3 py-1 capitalize">{candidate.status}</Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Percent className="h-4 w-4" /> Fit Score: <span className="font-semibold text-foreground">{(candidate.fitScore || 0)}%</span>
                        </div>
                        <Progress value={candidate.fitScore || 0} className="w-32 h-2" />
                    </>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
                 {isEditing ? (
                    <>
                        <Label htmlFor="parsedData.cv_language">CV Language</Label>
                        <Input id="parsedData.cv_language" {...register('parsedData.cv_language')} />
                        <Label htmlFor="positionId">Applied Position</Label>
                         <Controller
                            name="positionId"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={(value) => field.onChange(value === "___NONE___" ? null : value)} value={field.value ?? "___NONE___"}>
                                    <SelectTrigger><SelectValue placeholder="Select Position" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="___NONE___">N/A - General Application</SelectItem>
                                        {allDbPositions.map(pos => <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </>
                ) : (
                    <>
                        {renderField("Applied for", candidate.position?.title, Briefcase)}
                        {renderField("Application Date", candidate.applicationDate ? format(parseISO(candidate.applicationDate), "PPP") : 'N/A', CalendarDays)}
                        {renderField("CV Language", parsed?.cv_language, Tag)}
                    </>
                )}
                {candidate.resumePath && !isEditing && renderField(
                  "Resume", 
                  candidate.resumePath.split('-').pop()?.split('.').slice(0,-1).join('.') || candidate.resumePath.split('-').pop(), 
                  HardDrive,
                  true,
                  `${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${candidate.resumePath}`,
                  "_blank"
                )}
            </CardContent>
            {canManageCandidate && !isEditing && (
              <CardFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}><UploadCloud className="mr-2 h-4 w-4" /> Upload New Resume</Button>
                  <Button variant="outline" onClick={() => setIsTransitionsModalOpen(true)}><Edit className="mr-2 h-4 w-4" /> Manage Transitions</Button>
              </CardFooter>
            )}
          </Card>

          {canManageCandidate && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>Assign Recruiter</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.recruiter ? (
                  <p className="text-sm mb-2">Currently assigned to: <span className="font-semibold">{candidate.recruiter.name}</span></p>
                ) : (
                  <p className="text-sm text-muted-foreground mb-2">Not assigned to any recruiter.</p>
                )}
                <div className="flex items-center gap-2">
                  <Select
                    value={candidate.recruiterId || "unassigned"}
                    onValueChange={(value) => handleAssignRecruiter(value === "unassigned" ? null : value)}
                    disabled={isAssigningRecruiter || recruiters.length === 0}
                  >
                    <SelectTrigger className="w-full md:w-[280px]">
                      <SelectValue placeholder="Select Recruiter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassign</SelectItem>
                      {recruiters.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isAssigningRecruiter && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
                {recruiters.length === 0 && <p className="text-xs text-muted-foreground mt-1">No recruiters available for assignment.</p>}
              </CardContent>
            </Card>
          )}

          {parsed?.associatedMatchDetails && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Zap className="mr-2 h-5 w-5 text-orange-500" /> Primary n8n Match Details</CardTitle>
                <CardDescription>Details from automated matching process for the primary associated position.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {renderField("Matched Job Title", parsed.associatedMatchDetails.jobTitle)}
                {renderField("Fit Score (n8n)", `${parsed.associatedMatchDetails.fitScore}%`)}
                {parsed.associatedMatchDetails.n8nJobId && renderField("n8n Job ID", parsed.associatedMatchDetails.n8nJobId)}
                {parsed.associatedMatchDetails.reasons && parsed.associatedMatchDetails.reasons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Match Reasons:</h4>
                    <ul className="list-disc list-inside pl-4 text-sm text-foreground">
                      {parsed.associatedMatchDetails.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Personal Info Card */}
            <Card>
                <CardHeader><CardTitle className="flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary"/>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {isEditing ? (
                        <>
                            <Label htmlFor="parsedData.personal_info.title_honorific">Title</Label>
                            <Input id="parsedData.personal_info.title_honorific" {...register('parsedData.personal_info.title_honorific')} />
                            <Label htmlFor="parsedData.personal_info.firstname">First Name</Label>
                            <Input id="parsedData.personal_info.firstname" {...register('parsedData.personal_info.firstname')} />
                            <Label htmlFor="parsedData.personal_info.lastname">Last Name</Label>
                            <Input id="parsedData.personal_info.lastname" {...register('parsedData.personal_info.lastname')} />
                            <Label htmlFor="parsedData.personal_info.nickname">Nickname</Label>
                            <Input id="parsedData.personal_info.nickname" {...register('parsedData.personal_info.nickname')} />
                            <Label htmlFor="parsedData.personal_info.location">Location</Label>
                            <Input id="parsedData.personal_info.location" {...register('parsedData.personal_info.location')} />
                            <Label htmlFor="parsedData.personal_info.introduction_aboutme">About Me</Label>
                            <Textarea id="parsedData.personal_info.introduction_aboutme" {...register('parsedData.personal_info.introduction_aboutme')} />
                        </>
                    ) : (
                        <>
                            {renderField("Title", (parsed?.personal_info as PersonalInfo)?.title_honorific)}
                            {renderField("First Name", (parsed?.personal_info as PersonalInfo)?.firstname)}
                            {renderField("Last Name", (parsed?.personal_info as PersonalInfo)?.lastname)}
                            {renderField("Nickname", (parsed?.personal_info as PersonalInfo)?.nickname)}
                            {renderField("Location", (parsed?.personal_info as PersonalInfo)?.location, MapPin)}
                            {(parsed?.personal_info as PersonalInfo)?.introduction_aboutme && (
                                <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Info className="h-4 w-4 mr-2"/>About Me:</h4>
                                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{(parsed.personal_info as PersonalInfo).introduction_aboutme}</p>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

          {/* Education Card */}
            <Card>
                <CardHeader><CardTitle className="flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary"/>Education</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px]">
                    {isEditing ? (
                        <div className="space-y-4">
                            {educationFieldArray.fields.map((field, index) => (
                                <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30">
                                    <Input placeholder="University" {...register(`parsedData.education.${index}.university`)} />
                                    <Input placeholder="Major" {...register(`parsedData.education.${index}.major`)} />
                                    <Input placeholder="Field" {...register(`parsedData.education.${index}.field`)} />
                                    {/* Add other education fields as inputs */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        (parsed?.education && parsed.education.length > 0) ? (
                            <ul className="space-y-4">
                                {parsed.education.map((edu, index) => (
                                <li key={`edu-${index}-${edu.university || index}`} className="p-3 border rounded-md bg-muted/30">
                                    {renderField("University", edu.university)}
                                    {renderField("Major", edu.major)}
                                    {renderField("Field", edu.field)}
                                    {renderField("Campus", edu.campus)}
                                    {renderField("Period", edu.period, CalendarDays)}
                                    {renderField("Duration", edu.duration)}
                                    {renderField("GPA", edu.GPA)}
                                    {index < parsed.education!.length - 1 && <Separator className="my-3" />}
                                </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">No education details provided.</p>
                    )}
                    </ScrollArea>
                </CardContent>
            </Card>

          {/* Experience Card */}
          <Card>
              <CardHeader><CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Experience</CardTitle></CardHeader>
              <CardContent>
                  <ScrollArea className="h-[300px]">
                  {isEditing ? (
                        <div className="space-y-4">
                            {experienceFieldArray.fields.map((field, index) => (
                                <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30">
                                    <Input placeholder="Company" {...register(`parsedData.experience.${index}.company`)} />
                                    <Input placeholder="Position" {...register(`parsedData.experience.${index}.position`)} />
                                    <Textarea placeholder="Description" {...register(`parsedData.experience.${index}.description`)} />
                                    {/* Add other experience fields as inputs */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        (parsed?.experience && parsed.experience.length > 0) ? (
                            <ul className="space-y-4">
                                {console.log('Experience data:', parsed.experience)}
                                {parsed.experience.map((exp, index) => (
                                <li key={`exp-${index}-${exp.company || index}`} className="p-3 border rounded-md bg-muted/30">
                                    {renderField("Company", exp.company)}
                                    {renderField("Position", exp.position)}
                                    {renderField("Level", String(exp.postition_level))}
                                    {renderField("Period", exp.period, CalendarDays)}
                                    {renderField("Duration", exp.duration)}
                                    {exp.is_current_position !== undefined && renderField("Current Position", String(exp.is_current_position))}
                                    {exp.description && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mt-2 mb-1">Description:</h4>
                                            <p className="text-sm text-foreground whitespace-pre-wrap bg-background p-2 rounded">{exp.description}</p>
                                        </div>
                                    )}
                                    {index < parsed.experience!.length - 1 && <Separator className="my-3" />}
                                </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">No experience details provided.</p>
                    )}
                  </ScrollArea>
              </CardContent>
          </Card>
          
          {/* Skills Card */}
            <Card>
              <CardHeader><CardTitle className="flex items-center"><Star className="mr-2 h-5 w-5 text-primary"/>Skills</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]"> 
                {isEditing ? (
                    <div className="space-y-4">
                        {skillsFieldArray.fields.map((field, index) => (
                            <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30">
                                <Input placeholder="Skill Segment" {...register(`parsedData.skills.${index}.segment_skill`)} />
                                <Textarea placeholder="Skills (comma-separated)" {...register(`parsedData.skills.${index}.skill_string`)} />
                            </div>
                        ))}
                    </div>
                ) : (
                    (parsed?.skills && parsed.skills.length > 0) ? (
                        <ul className="space-y-4">
                            {parsed.skills.map((skillEntry, index) => (
                            <li key={`skill-${index}-${skillEntry.segment_skill || index}`} className="p-3 border rounded-md bg-muted/30">
                                {renderField("Segment", skillEntry.segment_skill)}
                                {skillEntry.skill && skillEntry.skill.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mt-1.5">Skills:</h4>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                    {skillEntry.skill.map((s, i) => <Badge key={`${index}-${i}-${s}`} variant="secondary">{s}</Badge>)}
                                    </div>
                                </div>
                                )}
                                {index < parsed.skills!.length - 1 && <Separator className="my-3" />}
                            </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No skill details provided.</p>
                )}
                </ScrollArea>
              </CardContent>
            </Card>

          {/* Job Suitability Card */}
            <Card>
              <CardHeader><CardTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>Job Suitability</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]"> 
                 {isEditing ? (
                    <div className="space-y-4">
                        {jobSuitableFieldArray.fields.map((field, index) => (
                            <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30">
                                <Input placeholder="Suitable Career Path" {...register(`parsedData.job_suitable.${index}.suitable_career`)} />
                                <Input placeholder="Suitable Job Position" {...register(`parsedData.job_suitable.${index}.suitable_job_position`)} />
                                {/* Add other job suitability fields as inputs */}
                            </div>
                        ))}
                    </div>
                ) : (
                    (parsed?.job_suitable && parsed.job_suitable.length > 0) ? (
                        <ul className="space-y-4">
                            {parsed.job_suitable.map((job, index) => (
                            <li key={`jobsuit-${index}-${job.suitable_career || index}`} className="p-3 border rounded-md bg-muted/30">
                                {renderField("Career Path", job.suitable_career)}
                                {renderField("Job Position", job.suitable_job_position)}
                                {renderField("Job Level", job.suitable_job_level)}
                                {renderField("Desired Salary (THB/Month)", job.suitable_salary_bath_month, DollarSign)}
                                {index < parsed.job_suitable!.length - 1 && <Separator className="my-3" />}
                            </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No job suitability details provided.</p>
                )}
                </ScrollArea>
              </CardContent>
            </Card>


          <Card>
            <CardHeader><CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Transition History</CardTitle></CardHeader>
            <CardContent>
              {candidate.transitionHistory && candidate.transitionHistory.length > 0 ? (
                <ScrollArea className="h-[300px]"> 
                <ul className="space-y-0">
                  {candidate.transitionHistory.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((record, index) => (
                    <li key={record.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <CalendarDays className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{record.stage}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(record.date), "MMM d, yyyy 'at' h:mm a")}
                            {record.actingUserName && <span className="italic"> by {record.actingUserName}</span>}
                          </p>
                          {record.notes && <p className="text-sm text-foreground mt-1.5 whitespace-pre-wrap">{record.notes}</p>}
                        </div>
                      </div>
                       {index < candidate.transitionHistory.length - 1 && <Separator className="my-3" />}
                    </li>
                  ))}
                </ul>
                </ScrollArea>
              ) : <p className="text-sm text-muted-foreground">No transition history available.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {parsed?.job_matches && parsed.job_matches.length > 0 && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-blue-600" />All n8n Job Matches</CardTitle>
                <CardDescription>Full list of job matches from n8n processing for this candidate.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-240px)]"> {/* Adjusted height */}
                  <ul className="space-y-3">
                    {parsed.job_matches.map((match, index) => (
                      <li key={`match-${index}-${match.job_id || index}`} className="p-3 border rounded-md bg-muted/30">
                        <h4 
                          className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer"
                          onClick={() => handleN8nJobMatchClick(match.job_title)}
                        >
                          {match.job_title} <ExternalLink className="inline h-3 w-3 ml-1 opacity-70" />
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          Fit Score: <span className="font-medium text-foreground">{match.fit_score}%</span>
                          {match.job_id && ` (n8n ID: ${match.job_id})`}
                        </div>
                        {match.match_reasons && match.match_reasons.length > 0 && (
                          <div className="mt-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Reasons:</p>
                            <ul className="list-disc list-inside pl-3 text-xs text-foreground">
                              {match.match_reasons.map((reason, i) => <li key={`reason-${index}-${i}`}>{reason}</li>)}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>

      {candidate && canManageCandidate && (
        <>
          <UploadResumeModal
              isOpen={isUploadModalOpen}
              onOpenChange={setIsUploadModalOpen}
              candidate={candidate}
              onUploadSuccess={handleUploadSuccess}
          />
          <ManageTransitionsModal
              candidate={candidate}
              isOpen={isTransitionsModalOpen}
              onOpenChange={setIsTransitionsModalOpen}
              onUpdateCandidate={handleUpdateCandidateStatus} 
              onRefreshCandidateData={fetchCandidateDetails} 
          />
        </>
      )}
      {selectedPositionForEdit && (
          <EditPositionModal
            isOpen={isEditPositionModalOpen}
            onOpenChange={setIsEditPositionModalOpen}
            position={selectedPositionForEdit}
            onEditPosition={handlePositionEdited}
          />
      )}
    </div>
  );
}
