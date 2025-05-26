
// src/app/candidates/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Candidate, CandidateDetails, TransitionRecord, EducationEntry, ExperienceEntry, SkillEntry, JobSuitableEntry, PersonalInfo, N8NJobMatch, UserProfile } from '@/lib/types';
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
import { ArrowLeft, Briefcase, CalendarDays, DollarSign, Edit, GraduationCap, HardDrive, Info, LinkIcon, ListChecks, Loader2, Mail, MapPin, MessageSquare, Percent, Phone, ServerCrash, ShieldAlert, Star, Tag, UploadCloud, User, UserCircle, UserCog, Users, Zap } from 'lucide-react';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal';
import { ManageTransitionsModal } from '@/components/candidates/ManageTransitionsModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';


const getStatusBadgeVariant = (status: Candidate['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Hired': case 'Offer Accepted': return 'default';
    case 'Interview Scheduled': case 'Interviewing': case 'Offer Extended': return 'secondary';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

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

  const fetchCandidateDetails = useCallback(async () => {
    if (!candidateId || sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);

    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Failed to fetch candidate: ${response.statusText || `Status ${response.status}`}`;
        if (response.status === 401) {
          setAuthError(true);
          signIn(undefined, { callbackUrl: `/candidates/${candidateId}` });
        } else {
          setFetchError(errorMessage);
        }
        setCandidate(null);
        return;
      }
      const data: Candidate = await response.json();
      setCandidate(data);
      console.log("Fetched candidate data:", data);
    } catch (error) {
      console.error("Error fetching candidate details:", error);
      setFetchError((error as Error).message || "Could not load candidate data.");
      setCandidate(null);
    } finally {
      setIsLoading(false);
    }
  }, [candidateId, sessionStatus, signIn]);

  const fetchRecruiters = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || (session?.user?.role !== 'Admin' && session?.user?.role !== 'Recruiter')) return;
    try {
      const response = await fetch('/api/users?role=Recruiter');
      if (!response.ok) throw new Error('Failed to fetch recruiters');
      const data: UserProfile[] = await response.json();
      setRecruiters(data.map(r => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      toast({ title: "Error", description: "Could not load recruiters for assignment.", variant: "destructive" });
    }
  }, [sessionStatus, session, toast]);


  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: `/candidates/${candidateId}` });
      return;
    }
    if (candidateId) {
      fetchCandidateDetails();
      if (session?.user?.role === 'Admin' || session?.user?.role === 'Recruiter') {
        fetchRecruiters();
      }
    }
  }, [candidateId, sessionStatus, fetchCandidateDetails, fetchRecruiters, signIn, session]);

  const handleUploadSuccess = (updatedCandidate: Candidate) => {
    setCandidate(updatedCandidate);
    setIsUploadModalOpen(false);
    toast({ title: "Resume Uploaded", description: "Resume successfully updated for this candidate." });
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
        const updatedCandidateFromServer: Candidate = await response.json();
        setCandidate(updatedCandidateFromServer);
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
      toast({ title: "Recruiter Assigned", description: `Candidate assigned to ${updatedCandidate.recruiter?.name || 'Unassigned'}.` });
    } catch (error) {
      toast({ title: "Error Assigning Recruiter", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsAssigningRecruiter(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-6">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">You need to be signed in to view candidate details.</p>
        <Button onClick={() => signIn(undefined, { callbackUrl: `/candidates/${candidateId}` })}>Sign In</Button>
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


  const renderField = (label: string, value?: string | number | null, icon?: React.ElementType) => {
    if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))) return null;
    const IconComponent = icon;
    return (
      <div className="flex items-start text-sm">
        {IconComponent && <IconComponent className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />}
        <span className="font-medium text-muted-foreground mr-1">{label}:</span>
        <span className="text-foreground break-words">{String(value)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/candidates')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Candidates
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarImage src={(parsed?.personal_info as PersonalInfo)?.avatar_url || `https://placehold.co/80x80.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar" />
                  <AvatarFallback className="text-3xl">{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl">{candidate.name}</CardTitle>
                  {renderField("Email", candidate.email, Mail)}
                  {renderField("Phone", candidate.phone, Phone)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={getStatusBadgeVariant(candidate.status)} className="text-base px-3 py-1 capitalize">{candidate.status}</Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Percent className="h-4 w-4" /> Fit Score: <span className="font-semibold text-foreground">{(candidate.fitScore || 0)}%</span>
                </div>
                <Progress value={candidate.fitScore || 0} className="w-32 h-2" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {renderField("Applied for", candidate.position?.title, Briefcase)}
                {renderField("Application Date", candidate.applicationDate ? format(parseISO(candidate.applicationDate), "PPP") : 'N/A', CalendarDays)}
                {renderField("CV Language", parsed?.cv_language, Tag)}
                {candidate.resumePath && (
                    <div className="flex items-start text-sm">
                        <HardDrive className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-muted-foreground mr-1">Resume:</span>
                        <span className="text-primary hover:underline cursor-pointer break-all" title={candidate.resumePath}>
                            {candidate.resumePath.split('-').pop()?.split('.').slice(0,-1).join('.') || candidate.resumePath.split('-').pop()}
                        </span>
                    </div>
                )}
            </CardContent>
            {canManageCandidate && (
              <CardFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}><UploadCloud className="mr-2 h-4 w-4" /> Upload New Resume</Button>
                  <Button variant="outline" onClick={() => setIsTransitionsModalOpen(true)}><Edit className="mr-2 h-4 w-4" /> Manage Transitions</Button>
              </CardFooter>
            )}
          </Card>

          {canManageCandidate && (
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

          {parsed?.associatedMatchDetails && (
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

          {parsed && (
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary"/>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                {renderField("Title", (parsed.personal_info as PersonalInfo)?.title_honorific)}
                {renderField("First Name", (parsed.personal_info as PersonalInfo)?.firstname)}
                {renderField("Last Name", (parsed.personal_info as PersonalInfo)?.lastname)}
                {renderField("Nickname", (parsed.personal_info as PersonalInfo)?.nickname)}
                {renderField("Location", (parsed.personal_info as PersonalInfo)?.location, MapPin)}
                {(parsed.personal_info as PersonalInfo)?.introduction_aboutme && (
                    <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Info className="h-4 w-4 mr-2"/>About Me:</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{(parsed.personal_info as PersonalInfo).introduction_aboutme}</p>
                    </div>
                )}
                </CardContent>
            </Card>
          )}

          {parsed?.education && parsed.education.length > 0 ? (
             <Card>
                <CardHeader>
                <CardTitle  className="flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary"/>Education</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-60">
                    <ul className="space-y-4">
                        {parsed.education.map((edu, index) => (
                        <li key={`edu-${index}`} className="p-3 border rounded-md bg-muted/30">
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
                    </ScrollArea>
                </CardContent>
            </Card>
            ) : (
            <Card>
                <CardHeader><CardTitle className="flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary"/>Education</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">No education details provided.</p></CardContent>
            </Card>
          )}

          {parsed?.experience && parsed.experience.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[500px]">
                  <ul className="space-y-4">
                    {console.log("Rendering experiences:", parsed.experience)}
                    {parsed.experience.map((exp, index) => (
                      <li key={`exp-${index}`} className="p-3 border rounded-md bg-muted/30">
                        {renderField("Company", exp.company)}
                        {renderField("Position", exp.position)}
                        {renderField("Level", exp.postition_level as string)}
                        {renderField("Period", exp.period, CalendarDays)}
                        {renderField("Duration", exp.duration)}
                        {exp.is_current_position !== undefined && renderField("Current Position", String(exp.is_current_position))}
                        {exp.description && (
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mt-2 mb-1">Description:</h4>
                                <p className="text-sm text-foreground whitespace-pre-wrap bg-background p-2 rounded">{exp.description}</p>
                            </div>
                        )}
                        {index < parsed.experience.length - 1 && <Separator className="my-3" />}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
                <CardHeader><CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Experience</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">No experience details provided.</p></CardContent>
            </Card>
          )}

          {parsed?.skills && parsed.skills.length > 0 ? (
            <Card>
              <CardHeader><CardTitle className="flex items-center"><Star className="mr-2 h-5 w-5 text-primary"/>Skills</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                <ul className="space-y-4">
                    {parsed.skills.map((skillEntry, index) => (
                    <li key={`skill-${index}`} className="p-3 border rounded-md bg-muted/30">
                        {renderField("Segment", skillEntry.segment_skill)}
                        {skillEntry.skill && skillEntry.skill.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mt-1.5">Skills:</h4>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                            {skillEntry.skill.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                            </div>
                        </div>
                        )}
                        {index < parsed.skills!.length - 1 && <Separator className="my-3" />}
                    </li>
                    ))}
                </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
                <CardHeader><CardTitle className="flex items-center"><Star className="mr-2 h-5 w-5 text-primary"/>Skills</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">No skill details provided.</p></CardContent>
            </Card>
          )}

          {parsed?.job_suitable && parsed.job_suitable.length > 0 ? (
            <Card>
              <CardHeader><CardTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>Job Suitability</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                <ul className="space-y-4">
                    {parsed.job_suitable.map((job, index) => (
                    <li key={`jobsuit-${index}`} className="p-3 border rounded-md bg-muted/30">
                        {renderField("Career Path", job.suitable_career)}
                        {renderField("Job Position", job.suitable_job_position)}
                        {renderField("Job Level", job.suitable_job_level)}
                        {renderField("Desired Salary (Bath/Month)", job.suitable_salary_bath_month, DollarSign)}
                        {index < parsed.job_suitable!.length - 1 && <Separator className="my-3" />}
                    </li>
                    ))}
                </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
                <CardHeader><CardTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>Job Suitability</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">No job suitability details provided.</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Transition History</CardTitle></CardHeader>
            <CardContent>
              {candidate.transitionHistory && candidate.transitionHistory.length > 0 ? (
                <ScrollArea className="h-60">
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

        {/* Right Column for Job Matches */}
        <div className="lg:col-span-1 space-y-6">
          {parsed?.job_matches && parsed.job_matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-blue-600" />All n8n Job Matches</CardTitle>
                <CardDescription>Full list of job matches from n8n processing.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[calc(100vh-120px)]"> {/* Adjust max-h as needed */}
                  <ul className="space-y-3">
                    {parsed.job_matches.map((match, index) => (
                      <li key={`match-${index}`} className="p-3 border rounded-md bg-muted/30">
                        <h4 className="font-semibold text-foreground">{match.job_title}</h4>
                        <div className="text-sm text-muted-foreground">
                          Fit Score: <span className="font-medium text-foreground">{match.fit_score}%</span>
                          {match.job_id && ` (ID: ${match.job_id})`}
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
            onUpdateCandidate={handleUpdateCandidateStatus} // This updates candidate status
            onRefreshCandidateData={fetchCandidateDetails} // This refreshes full candidate details (incl. history)
        />
        </>
      )}
    </div>
  );
}
