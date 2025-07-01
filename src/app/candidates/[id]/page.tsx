"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Candidate, CandidateDetails, TransitionRecord, EducationEntry, ExperienceEntry, SkillEntry, JobSuitableEntry, PersonalInfo, AutomationJobMatch, UserProfile, Position, PositionLevel, RecruitmentStage } from '@/lib/types';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { ArrowLeft, Briefcase, CalendarDays, DollarSign, Edit, GraduationCap, HardDrive, Info, LinkIcon, ListChecks, Loader2, Mail, MapPin, MessageSquare, Percent, Phone, ServerCrash, ShieldAlert, Star, Tag, UploadCloud, User, UserCircle, UserCog, Users, Zap, ExternalLink, Edit3, Save, X, PlusCircle, Trash2, Lightbulb } from 'lucide-react';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal';
import { ManageTransitionsModal } from '@/components/candidates/ManageTransitionsModal';
import { EditPositionModal } from '@/components/positions/EditPositionModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { ImageUpload } from '@/components/ui/image-upload';

const MINIO_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_MINIO_URL || `http://localhost:9847`;
const MINIO_BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET_NAME || "canditrack-resumes";

const PLACEHOLDER_VALUE_NONE = "___NOT_SPECIFIED___";
const positionLevelOptions: PositionLevel[] = ['entry level', 'mid level', 'senior level', 'lead', 'manager', 'executive', 'officer', 'leader'];


const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Hired': case 'Offer Accepted': return 'default';
    case 'Interview Scheduled': case 'Interviewing': case 'Offer Extended': return 'secondary';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

const personalInfoEditSchema = z.object({
  title_honorific: z.string().optional().nullable(),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  nickname: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  introduction_aboutme: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
}).deepPartial();

const contactInfoEditSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
}).deepPartial();

const educationEntryEditSchema = z.object({
    major: z.string().optional().nullable(),
    field: z.string().optional().nullable(),
    period: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    GPA: z.string().optional().nullable(),
    university: z.string().optional().nullable(),
    campus: z.string().optional().nullable(),
}).deepPartial();

const experienceEntryEditSchema = z.object({
    company: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    period: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    is_current_position: z.boolean().optional(),
    postition_level: z.string().optional().nullable(),
}).deepPartial();

const skillEntryEditSchema = z.object({
    segment_skill: z.string().optional().nullable(),
    skill_string: z.string().optional().nullable(),
    skill: z.array(z.string()).optional(),
}).deepPartial();

const jobSuitableEntryEditSchema = z.object({
    suitable_career: z.string().optional().nullable(),
    suitable_job_position: z.string().optional().nullable(),
    suitable_job_level: z.string().optional().nullable(),
    suitable_salary_bath_month: z.string().optional().nullable(),
}).deepPartial();

const candidateDetailsEditSchema = z.object({
  cv_language: z.string().optional().nullable(),
  personal_info: personalInfoEditSchema.optional(),
  contact_info: contactInfoEditSchema.optional(),
  education: z.array(educationEntryEditSchema).optional(),
  experience: z.array(experienceEntryEditSchema).optional(),
  skills: z.array(skillEntryEditSchema).optional(),
  job_suitable: z.array(jobSuitableEntryEditSchema).optional(),
}).deepPartial();

const editCandidateDetailSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().nullable().optional(),
  recruiterId: z.string().uuid().nullable().optional(),
  fitScore: z.number().min(0).max(100).nullable().optional(),
  status: z.string().min(1, "Status is required").optional(),
  parsedData: candidateDetailsEditSchema.optional(),
});

type EditCandidateFormValues = z.infer<typeof editCandidateDetailSchema>;


interface RoleSuggestionSummaryProps {
  candidate: Candidate | null;
  allDbPositions: Position[];
}

const RoleSuggestionSummary: React.FC<RoleSuggestionSummaryProps> = ({ candidate, allDbPositions }) => {
  if (!candidate || !candidate.parsedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />Role Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No automated job match data to provide suggestions.</p>
        </CardContent>
      </Card>
    );
  }

  const jobMatches = (candidate.parsedData as CandidateDetails)?.job_matches;

  if (!jobMatches || jobMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />Role Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No automated job match data to provide suggestions.</p>
        </CardContent>
      </Card>
    );
  }

  const currentAppliedPositionId = candidate.positionId;
  const currentAppliedPosition = allDbPositions.find(p => p.id === currentAppliedPositionId);
  const currentFitScore = candidate.fitScore || 0;
  let bestAlternativeMatch: AutomationJobMatch | null = null;
  let bestAlternativeScore = currentFitScore;
  let bestAlternativePositionInDb: Position | null = null;

  const openPositionsMap = new Map(allDbPositions.filter(p => p.isOpen).map(p => [p.title.toLowerCase(), p]));

  for (const jobMatch of jobMatches) {
    const jobMatchTitleLower = jobMatch.job_title?.toLowerCase(); // job_title can be optional/null
    if (!jobMatchTitleLower) continue;

    const dbPositionMatch = openPositionsMap.get(jobMatchTitleLower);

    if (dbPositionMatch && dbPositionMatch.id !== currentAppliedPositionId) {
      if (jobMatch.fit_score > bestAlternativeScore && (jobMatch.fit_score - currentFitScore >= 10)) {
        bestAlternativeScore = jobMatch.fit_score;
        bestAlternativeMatch = jobMatch;
        bestAlternativePositionInDb = dbPositionMatch;
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />Role Suggestion</CardTitle>
      </CardHeader>
      <CardContent>
        {bestAlternativeMatch && bestAlternativePositionInDb ? (
          <div className="p-3 border border-dashed border-primary/50 rounded-md bg-primary/5">
            <p className="text-sm text-foreground">
              Consider {candidate.name} for the role of <strong>{bestAlternativeMatch.job_title}</strong> (Open Position).
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated Fit Score for this role: <span className="font-semibold text-foreground">{bestAlternativeMatch.fit_score}%</span>.
            </p>
            {currentAppliedPosition ? (
              <p className="text-xs text-muted-foreground">
                Currently applied for: &quot;{currentAppliedPosition.title}&quot; (Fit Score: {currentFitScore}%)
              </p>
            ) : (
               <p className="text-xs text-muted-foreground">Currently not formally applied to a specific position in our system (General Fit Score: {currentFitScore}%).</p>
            )}
            {bestAlternativeMatch.match_reasons && bestAlternativeMatch.match_reasons.length > 0 && (
              <div className="mt-1.5">
                <p className="text-xs font-medium text-muted-foreground">Top Match Reasons for Suggested Role:</p>
                <ul className="list-disc list-inside pl-3 text-xs text-foreground">
                  {bestAlternativeMatch.match_reasons.slice(0, 2).map((reason, i) => <li key={`reason-sugg-${i}`}>{reason}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Candidate appears well-suited for their current applied role, or no significantly stronger alternative open roles were identified from automated matches.</p>
        )}
      </CardContent>
    </Card>
  );
};


export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [recruiters, setRecruiters] = useState<Pick<UserProfile, 'id' | 'name'>[]>([]);
  const [isAssigningRecruiter, setIsAssigningRecruiter] = useState(false);

  const { data: session, status: sessionStatus } = useSession();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTransitionsModalOpen, setIsTransitionsModalOpen] = useState(false);

  const [allDbPositions, setAllDbPositions] = useState<Position[]>([]);
  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>([]);

  const [isEditing, setIsEditing] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const form = useForm<EditCandidateFormValues>({
    resolver: zodResolver(editCandidateDetailSchema),
    defaultValues: {},
  });

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = form;

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control, name: "parsedData.education" });
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control, name: "parsedData.experience" });
  const { fields: skillsFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control, name: "parsedData.skills" });
  const { fields: jobSuitableFields, append: appendJobSuitable, remove: removeJobSuitable } = useFieldArray({ control, name: "parsedData.job_suitable" });


  const fetchCandidateDetails = useCallback(async () => {
    if (!candidateId) return;
    setIsLoading(true);
    setFetchError(null);

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
            })) || [],
            experience: ((data.parsedData as CandidateDetails)?.experience?.map(exp => ({
                ...exp,
                is_current_position: typeof exp.is_current_position === 'string'
                    ? exp.is_current_position === 'true'
                    : !!exp.is_current_position,
            })) || []) as {
                period?: string | null;
                duration?: string | null;
                company?: string | null;
                position?: string | null;
                description?: string | null;
                is_current_position?: boolean;
                postition_level?: string | null;
            }[],
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
    try {
      const response = await fetch('/api/users?role=Recruiter');
      if (!response.ok) throw new Error('Failed to fetch recruiters');
      const data: UserProfile[] = await response.json();
      setRecruiters(data.map(r => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      toast("Could not load recruiters for assignment.");
    }
  }, []);

  const fetchPositionsAndStages = useCallback(async () => {
    try {
      const [posResponse, stagesResponse] = await Promise.all([
        fetch('/api/positions'),
        fetch('/api/settings/recruitment-stages')
      ]);

      if (posResponse.ok) {
        const posData = await posResponse.json();
        setAllDbPositions(posData.positions || []);
      } else {
        console.error("Failed to fetch positions");
        toast("Could not load the list of available positions.");
      }

      if (stagesResponse.ok) {
        const stagesData = await stagesResponse.json();
        setAvailableStages(stagesData.stages || []);
      } else {
        console.error("Failed to fetch recruitment stages");
        toast("Could not load recruitment stages.");
      }
    } catch (error) {
      console.error("Error fetching positions or stages:", error);
      toast("A network error occurred while fetching initial data.");
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchCandidateDetails();
      fetchRecruiters();
      fetchPositionsAndStages();
    }
  }, [candidateId, sessionStatus, fetchCandidateDetails, fetchRecruiters, fetchPositionsAndStages]);

  useEffect(() => {
    if (fetchError) {
      toast(fetchError);
    }
  }, [fetchError]);

  const handleUploadSuccess = (updatedCandidate: Candidate) => {
    setCandidate(updatedCandidate);
    setIsUploadModalOpen(false);
    toast("Resume has been uploaded and candidate details updated.");
    fetchCandidateDetails(); // Re-fetch to ensure all data is fresh
  };

  const handleTransitionsUpdated = (updatedHistory: TransitionRecord[], newStatus: string) => {
    if (candidate) {
      setCandidate({ ...candidate, status: newStatus, transitionHistory: updatedHistory });
    }
    fetchCandidateDetails();
  };

  const handleUpdateCandidateStatus = async (id: string, newStatus: string, notes?: string) => {
    setIsLoading(true);
    try {
      const payload: { status: string; transitionNotes?: string } = { status: newStatus };
      if (notes) {
        payload.transitionNotes = notes;
      }
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update status.');
      }

      const updatedCandidate = await response.json();
      setCandidate(updatedCandidate.candidate);
      toast(`Candidate status changed to ${newStatus}.`);
    } catch (error: any) {
      toast(error.message);
    } finally {
      setIsLoading(false);
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
        throw new Error(`Failed to assign recruiter: ${response.statusText}`);
      }
      const updatedCandidate: Candidate = await response.json();
      setCandidate(updatedCandidate);
      reset({
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
          })) || [],
          experience: ((updatedCandidate.parsedData as CandidateDetails)?.experience?.map(exp => ({
            ...exp,
            is_current_position: typeof exp.is_current_position === 'string'
              ? exp.is_current_position === 'true'
              : !!exp.is_current_position,
          })) || []) as {
            period?: string | null;
            duration?: string | null;
            company?: string | null;
            position?: string | null;
            description?: string | null;
            is_current_position?: boolean;
            postition_level?: string | null;
          }[],
        }
      });
      toast(`Candidate assigned to ${updatedCandidate.recruiter?.name || 'Unassigned'}.`);
    } catch (error) {
      toast((error as Error).message);
    } finally {
      setIsAssigningRecruiter(false);
    }
  };

  const handleJobMatchClick = (jobMatchTitle: string | null | undefined) => {
    if (!jobMatchTitle) {
        toast("Job match data is incomplete.");
        return;
    }
    const matchedPosition = allDbPositions.find(p => p.title.toLowerCase() === jobMatchTitle.toLowerCase());
    if (matchedPosition) {
      setSelectedPositionForEdit(matchedPosition);
      setIsEditPositionModalOpen(true);
    } else {
      toast(`Position "${jobMatchTitle}" not found in the system.`);
    }
  };

  const handlePositionEdited = async () => {
    toast("Position details have been saved.");
    setIsEditPositionModalOpen(false);
    await fetchPositionsAndStages();
    if (candidateId) {
        await fetchCandidateDetails();
    }
  };

  const handleSaveDetails = async (data: EditCandidateFormValues) => {
    if (!candidate) return;

    const processedData = {
        ...data,
        parsedData: {
            ...data.parsedData,
            skills: data.parsedData?.skills?.map(s => ({
                segment_skill: s.segment_skill,
                skill: s.skill_string?.split(',').map(sk => sk.trim()).filter(sk => sk) || [],
            })),
            experience: data.parsedData?.experience?.map(exp => ({
                ...exp,
                postition_level: exp.postition_level === PLACEHOLDER_VALUE_NONE ? null : exp.postition_level
            }))
        }
    };

    try {
        const response = await fetch(`/api/candidates/${candidate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(processedData),
        });
        if (!response.ok) {
            throw new Error(`Failed to update candidate: ${response.statusText}`);
        }
        await fetchCandidateDetails();
        setIsEditing(false);
        toast("Candidate details updated successfully.");
    } catch (error) {
        toast((error as Error).message);
    }
  };

  const handleCancelEdit = () => {
    if (candidate) {
        reset({
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
                    skill_string: Array.isArray(s.skill)
                        ? s.skill.filter((sk): sk is string => typeof sk === 'string').join(', ')
                        : (typeof s.skill_string === 'string' ? s.skill_string : '')
                })) || [],
                experience: ((candidate.parsedData as CandidateDetails)?.experience?.map(exp => ({
                    ...exp,
                    is_current_position: typeof exp.is_current_position === 'string'
                        ? exp.is_current_position === 'true'
                        : !!exp.is_current_position,
                })) || []) as {
                    period?: string | null;
                    duration?: string | null;
                    company?: string | null;
                    position?: string | null;
                    description?: string | null;
                    is_current_position?: boolean;
                    postition_level?: string | null;
                }[],
            }
        });
    }
    setIsEditing(false);
  };


  if (isLoading && !fetchError) {
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
  const personalInfo = parsed?.personal_info as PersonalInfo | undefined;

  const renderField = (label: string, value?: string | number | null, icon?: React.ElementType, isLink?: boolean, linkHref?: string, linkTarget?: string) => {
    if (value === undefined || value === null || String(value).trim() === '' || (typeof value === 'number' && isNaN(value))) return null;
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

  const getDisplayFilename = (filePath: string | null | undefined): string => {
    if (!filePath) return "View Resume";
    // Ensure filePath is a string before attempting to split
    if (typeof filePath !== 'string') return "Invalid Path";
    const parts = filePath.split('-');
    if (parts.length > 2) {
      return parts.slice(2).join('-').replace(/_/g, ' ');
    }
    return parts.pop() || "View Resume";
  };

  return (
    <FormProvider {...form}>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" onClick={() => router.push('/candidates')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Candidates
          </Button>
          {!isEditing && (
              <Button onClick={() => setIsEditing(true)}><Edit3 className="mr-2 h-4 w-4"/> Edit Details</Button>
          )}
          {isEditing && (
              <div className="flex gap-2">
                  <Button onClick={handleSubmit(handleSaveDetails)} variant="default" disabled={isSubmitting} className="btn-primary-gradient">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                      <X className="mr-2 h-4 w-4"/> Cancel
                  </Button>
              </div>
          )}
        </div>
        <form onSubmit={handleSubmit(handleSaveDetails)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar Upload */}
                    {isEditing ? (
                      <div className="flex flex-col items-center gap-2">
                        <ImageUpload
                          value={personalInfo?.avatar_url || ''}
                          onChange={async (value) => {
                            setAvatarError(null);
                            if (value && value.startsWith('data:image/')) {
                              setAvatarUploading(true);
                              try {
                                const res = await fetch(value);
                                const blob = await res.blob();
                                const formData = new FormData();
                                formData.append('avatar', new File([blob], 'avatar.png', { type: blob.type }));
                                const uploadRes = await fetch(`/api/candidates/${candidate.id}/avatar`, {
                                  method: 'POST',
                                  body: formData,
                                });
                                const result = await uploadRes.json();
                                if (!uploadRes.ok) throw new Error(result.message || 'Upload failed');
                                setValue('parsedData.personal_info.avatar_url', result.avatar_url);
                                setAvatarUploading(false);
                              } catch (err: any) {
                                setAvatarError(err.message || 'Failed to upload avatar');
                                setAvatarUploading(false);
                              }
                            } else {
                              setValue('parsedData.personal_info.avatar_url', value);
                            }
                          }}
                          label="Avatar"
                          placeholder="Enter avatar URL or upload image file"
                          previewSize="md"
                          allowUrl={true}
                          allowFile={true}
                        />
                        {avatarUploading && (
                          <div className="text-xs text-muted-foreground mt-1">Uploading avatar...</div>
                        )}
                        {avatarError && (
                          <div className="text-xs text-destructive mt-1">{avatarError}</div>
                        )}
                      </div>
                    ) : (
                      <Avatar className="h-20 w-20 border-2 border-primary">
                        <AvatarImage src={personalInfo?.avatar_url || `https://placehold.co/80x80.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar" />
                        <AvatarFallback className="text-3xl">{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      {isEditing ? (
                        <>
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" {...register('name')} className="text-3xl font-bold" />
                          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}

                          <Label htmlFor="email" className="mt-1 block">Email</Label>
                          <Input id="email" {...register('email')} />
                          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}

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
                                            {availableStages.map(s => (
                                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
                            <Label htmlFor="fitScore" className="mt-1">Fit Score (Applied Position)</Label>
                            <Input id="fitScore" type="number" {...register('fitScore', { valueAsNumber: true })} className="w-32 text-right" />

                        </>
                      ) : (
                        <>
                            <Badge variant={getStatusBadgeVariant(candidate.status)} className="text-base px-3 py-1 capitalize">{candidate.status}</Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Percent className="h-4 w-4" /> Fit Score (Applied Position): <span className="font-semibold text-foreground">{(candidate.fitScore || 0)}%</span>
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
                            <Label htmlFor="positionId">Applied for Position</Label>
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
                            {renderField("Applied for", candidate.position?.title || 'N/A - General Application', Briefcase)}
                            {renderField("Application Date", candidate.applicationDate ? format(parseISO(candidate.applicationDate), "PPP") : 'N/A', CalendarDays)}
                            {renderField("CV Language", parsed?.cv_language, Tag)}
                        </>
                    )}
                    {candidate.resumePath && !isEditing && renderField(
                      "Resume",
                      getDisplayFilename(candidate.resumePath),
                      HardDrive,
                      true,
                      `${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${candidate.resumePath}`, 
                      "_blank"
                    )}
                     {(parsed?.associatedMatchDetails && !isEditing) && (
                      <Card className="mt-4 bg-muted/50 p-3">
                        <CardHeader className="p-0 pb-1">
                          <CardTitle className="text-sm font-semibold flex items-center"><Zap className="mr-2 h-4 w-4 text-orange-500" /> Initial Processed Match</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 text-xs space-y-0.5">
                          {renderField("Matched Job", parsed.associatedMatchDetails.jobTitle)}
                          {renderField("Processed Fit Score", `${parsed.associatedMatchDetails.fitScore}%`)}
                        </CardContent>
                      </Card>
                    )}
                </CardContent>
                {!isEditing && (
                  <CardFooter className="gap-2">
                      <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}><UploadCloud className="mr-2 h-4 w-4" /> Upload New Resume</Button>
                      <Button variant="outline" onClick={() => setIsTransitionsModalOpen(true)}><Edit className="mr-2 h-4 w-4" /> Manage Transitions</Button>
                  </CardFooter>
                )}
              </Card>

              {!isEditing && (
                 <RoleSuggestionSummary candidate={candidate} allDbPositions={allDbPositions} />
              )}


              <Card>
                    <CardHeader><CardTitle className="flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary"/>Personal Information</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {isEditing ? (
                            <>
                                <Label htmlFor="parsedData.personal_info.title_honorific">Title</Label>
                                <Input id="parsedData.personal_info.title_honorific" {...register('parsedData.personal_info.title_honorific')} />
                                <Label htmlFor="parsedData.personal_info.firstname">First Name *</Label>
                                <Input id="parsedData.personal_info.firstname" {...register('parsedData.personal_info.firstname')} />
                                {errors.parsedData?.personal_info?.firstname && <p className="text-sm text-destructive">{errors.parsedData.personal_info.firstname.message}</p>}
                                <Label htmlFor="parsedData.personal_info.lastname">Last Name *</Label>
                                <Input id="parsedData.personal_info.lastname" {...register('parsedData.personal_info.lastname')} />
                                {errors.parsedData?.personal_info?.lastname && <p className="text-sm text-destructive">{errors.parsedData.personal_info.lastname.message}</p>}
                                <Label htmlFor="parsedData.personal_info.nickname">Nickname</Label>
                                <Input id="parsedData.personal_info.nickname" {...register('parsedData.personal_info.nickname')} />
                                <Label htmlFor="parsedData.personal_info.location">Location</Label>
                                <Input id="parsedData.personal_info.location" {...register('parsedData.personal_info.location')} />
                                <Label htmlFor="parsedData.personal_info.introduction_aboutme">About Me</Label>
                                <Textarea id="parsedData.personal_info.introduction_aboutme" {...register('parsedData.personal_info.introduction_aboutme')} />
                            </>
                        ) : (
                            <>
                                {renderField("Title", personalInfo?.title_honorific)}
                                {renderField("First Name", personalInfo?.firstname)}
                                {renderField("Last Name", personalInfo?.lastname)}
                                {renderField("Nickname", personalInfo?.nickname)}
                                {renderField("Location", personalInfo?.location, MapPin)}
                                {(personalInfo)?.introduction_aboutme && (
                                    <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Info className="h-4 w-4 mr-2"/>About Me:</h4>
                                    <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{personalInfo.introduction_aboutme}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary"/>Education</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                        {isEditing ? (
                            <div className="space-y-4">
                                {educationFields.map((field, index) => (
                                    <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30 relative">
                                        <Input placeholder="University" {...register(`parsedData.education.${index}.university`)} />
                                        <Input placeholder="Major" {...register(`parsedData.education.${index}.major`)} />
                                        <Input placeholder="Field" {...register(`parsedData.education.${index}.field`)} />
                                        <Input placeholder="Campus" {...register(`parsedData.education.${index}.campus`)} />
                                        <Input placeholder="Period" {...register(`parsedData.education.${index}.period`)} />
                                        <Input placeholder="Duration" {...register(`parsedData.education.${index}.duration`)} />
                                        <Input placeholder="GPA" {...register(`parsedData.education.${index}.GPA`)} />
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeEducation(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                 <Button type="button" variant="outline" className="mt-2" onClick={() => appendEducation({ university: '', major: '', field: '', campus: '', period: '', duration: '', GPA: '' })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                                </Button>
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
                            ) : <div className="text-sm text-muted-foreground text-center py-4">No education details provided.</div>
                        )}
                        </ScrollArea>
                    </CardContent>
                </Card>

              <Card>
                  <CardHeader><CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Experience</CardTitle></CardHeader>
                  <CardContent>
                      <ScrollArea className="h-[300px]">
                      {isEditing ? (
                            <div className="space-y-4">
                                {experienceFields.map((field, index) => (
                                    <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30 relative">
                                        <Input placeholder="Company" {...register(`parsedData.experience.${index}.company`)} />
                                        <Input placeholder="Position" {...register(`parsedData.experience.${index}.position`)} />
                                        <Textarea placeholder="Description" {...register(`parsedData.experience.${index}.description`)} />
                                        <Input placeholder="Period" {...register(`parsedData.experience.${index}.period`)} />
                                        <Input placeholder="Duration" {...register(`parsedData.experience.${index}.duration`)} />
                                         <Controller
                                            name={`parsedData.experience.${index}.postition_level`}
                                            control={control}
                                            render={({ field: controllerField }) => (
                                                <Select
                                                    onValueChange={(value) => controllerField.onChange(value === PLACEHOLDER_VALUE_NONE ? null : value)}
                                                    value={controllerField.value ?? PLACEHOLDER_VALUE_NONE}
                                                >
                                                <SelectTrigger><SelectValue placeholder="Position Level" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={PLACEHOLDER_VALUE_NONE}>N/A / Not Specified</SelectItem>
                                                    {positionLevelOptions.map(level => <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>)}
                                                </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        <div className="flex items-center space-x-2">
                                            <Controller
                                                name={`parsedData.experience.${index}.is_current_position`}
                                                control={control}
                                                render={({ field: controllerField }) => (
                                                    <Checkbox
                                                        id={`experience.${index}.is_current_position`}
                                                        checked={!!controllerField.value}
                                                        onCheckedChange={controllerField.onChange}
                                                    />
                                                )}
                                            />
                                            <Label htmlFor={`experience.${index}.is_current_position`}>Current Position</Label>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeExperience(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="mt-2" onClick={() => appendExperience({ company: '', position: '', period: '', duration: '', is_current_position: false, description: '', postition_level: null })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                                </Button>
                            </div>
                        ) : (
                            (parsed?.experience && parsed.experience.length > 0) ? (
                                <ul className="space-y-4">
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
                            ) : <div className="text-sm text-muted-foreground text-center py-4">No experience details provided.</div>
                        )}
                      </ScrollArea>
                  </CardContent>
              </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center"><Star className="mr-2 h-5 w-5 text-primary"/>Skills</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                    {isEditing ? (
                        <div className="space-y-4">
                            {skillsFields.map((field, index) => (
                                <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30 relative">
                                    <Input placeholder="Skill Segment" {...register(`parsedData.skills.${index}.segment_skill`)} />
                                    <Textarea placeholder="Skills (comma-separated)" {...register(`parsedData.skills.${index}.skill_string`)} />
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeSkill(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" className="mt-2" onClick={() => appendSkill({ segment_skill: '', skill_string: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Skill Segment
                            </Button>
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
                        ) : <div className="text-sm text-muted-foreground text-center py-4">No skill details provided.</div>
                    )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>Job Suitability</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                     {isEditing ? (
                        <div className="space-y-4">
                            {jobSuitableFields.map((field, index) => (
                                <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30 relative">
                                    <Input placeholder="Suitable Career Path" {...register(`parsedData.job_suitable.${index}.suitable_career`)} />
                                    <Input placeholder="Suitable Job Position" {...register(`parsedData.job_suitable.${index}.suitable_job_position`)} />
                                    <Input placeholder="Suitable Job Level" {...register(`parsedData.job_suitable.${index}.suitable_job_level`)} />
                                    <Input placeholder="Desired Salary (THB/Month)" {...register(`parsedData.job_suitable.${index}.suitable_salary_bath_month`)} />
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeJobSuitable(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" className="mt-2" onClick={() => appendJobSuitable({ suitable_career: '', suitable_job_position: '', suitable_job_level: '', suitable_salary_bath_month: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Job Suitability
                            </Button>
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
                        ) : <div className="text-sm text-muted-foreground text-center py-4">No job suitability details provided.</div>
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
                  ) : <div className="text-sm text-muted-foreground text-center py-4">No transition history available.</div>}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              {(parsed?.job_matches && parsed.job_matches.length > 0 && !isEditing) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-blue-600" />Suggested Jobs</CardTitle>
                    <CardDescription>Full list of job matches from automated processing for this candidate.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-240px)]">
                      <ul className="space-y-3">
                        {parsed.job_matches.map((match, index) => (
                          <li key={`match-${index}-${match.job_id || index}`} className="p-3 border rounded-md bg-muted/30">
                            <h4
                              className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer"
                              onClick={() => handleJobMatchClick(match.job_title)}
                            >
                              {match.job_title || 'Job Title Missing'} <ExternalLink className="inline h-3 w-3 ml-1 opacity-70" />
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              Fit Score: <span className="font-medium text-foreground">{match.fit_score}%</span>
                              {match.job_id && ` (Match ID: ${match.job_id})`}
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
               {(!isEditing && (!parsed?.job_matches || parsed.job_matches.length === 0)) && (
                 <Card>
                    <CardHeader><CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-blue-600" />Suggested Jobs</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground text-center py-4">No automated job match data available.</p></CardContent>
                 </Card>
               )}
            </div>
          </div>
        </form>

        {candidate && (
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
                availableStages={availableStages}
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
    </FormProvider>
  );
}
