
// src/components/candidates/CandidatesPageClient.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import type { Candidate, CandidateStatus, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PlusCircle, Users, ServerCrash, Zap, Loader2, FileDown, FileUp, ChevronDown, FileSpreadsheet, ShieldAlert, Brain, Trash2 as BulkTrashIcon, Edit as BulkEditIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AddCandidateModal, type AddCandidateFormValues } from '@/components/candidates/AddCandidateModal';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal';
import { CreateCandidateViaN8nModal } from '@/components/candidates/CreateCandidateViaN8nModal';
import { ImportCandidatesModal } from '@/components/candidates/ImportCandidatesModal';
import { EditPositionModal } from '@/components/positions/EditPositionModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; 
import { Textarea } from '@/components/ui/textarea'; 


interface CandidatesPageClientProps {
  initialCandidates: Candidate[];
  initialAvailablePositions: Position[];
  initialAvailableStages: RecruitmentStage[];
  authError?: boolean;
  permissionError?: boolean;
  initialFetchError?: string; // Added for server-side errors
}

function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function CandidatesPageClient({
  initialCandidates,
  initialAvailablePositions,
  initialAvailableStages,
  authError: serverAuthError = false,
  permissionError: serverPermissionError = false,
  initialFetchError,
}: CandidatesPageClientProps) {
  const [filters, setFilters] = useState<CandidateFilterValues>({ minFitScore: 0, maxFitScore: 100, positionId: "__ALL_POSITIONS__", status: "all" });

  const [allCandidates, setAllCandidates] = useState<Candidate[]>(initialCandidates || []);
  const [availablePositions, setAvailablePositions] = useState<Position[]>(initialAvailablePositions || []);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>(initialAvailableStages || []);
  const [availableRecruiters, setAvailableRecruiters] = useState<Pick<UserProfile, 'id' | 'name'>[]>([]);

  const [isLoading, setIsLoading] = useState(true); 
  const [isAiSearching, setIsAiSearching] = useState(false); 
  const [aiSearchReasoning, setAiSearchReasoning] = useState<string | null>(null);
  const [aiMatchedCandidateIds, setAiMatchedCandidateIds] = useState<string[] | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateViaN8nModalOpen, setIsCreateViaN8nModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCandidateForUpload, setSelectedCandidateForUpload] = useState<Candidate | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError || null);
  const [authError, setAuthError] = useState(serverAuthError);
  const [permissionError, setPermissionError] = useState(serverPermissionError);

  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);
  const { data: session, status: sessionStatus } = useSession();

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [isBulkActionConfirmOpen, setIsBulkActionConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'change_status' | 'assign_recruiter' | null>(null);
  const [bulkNewStatus, setBulkNewStatus] = useState<string>('');
  const [bulkNewRecruiterId, setBulkNewRecruiterId] = useState<string | null>(null);
  const [bulkTransitionNotes, setBulkTransitionNotes] = useState<string>('');


  const canImportCandidates = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('CANDIDATES_IMPORT');
  const canExportCandidates = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('CANDIDATES_EXPORT');
  const canManageCandidates = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('CANDIDATES_MANAGE');


  const fetchRecruiters = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    try {
      const response = await fetch('/api/users?role=Recruiter');
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch recruiters' }));
          throw new Error(errorData.message || 'Failed to fetch recruiters');
      }
      const recruitersData: UserProfile[] | undefined = await response.json(); // Expect UserProfile[] or handle undefined
      if (!recruitersData || !Array.isArray(recruitersData)) {
        throw new Error('Invalid data format received for recruiters.');
      }
      setAvailableRecruiters(recruitersData.map(r => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      toast({ title: "Error", description: `Could not load recruiters: ${(error as Error).message}`, variant: "destructive" });
    }
  }, [sessionStatus, toast]);


  const fetchFilteredCandidatesOnClient = useCallback(async (currentFilters: CandidateFilterValues) => {
    if (sessionStatus !== 'authenticated') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);
    setPermissionError(false);
    setAiMatchedCandidateIds(null); 
    setAiSearchReasoning(null);

    try {
      const query = new URLSearchParams();
      if (currentFilters.name) query.append('name', currentFilters.name);
      if (currentFilters.email) query.append('email', currentFilters.email);
      if (currentFilters.phone) query.append('phone', currentFilters.phone);
      if (currentFilters.positionId && currentFilters.positionId !== "__ALL_POSITIONS__") query.append('positionId', currentFilters.positionId);
      if (currentFilters.status && currentFilters.status !== "all") query.append('status', currentFilters.status);
      if (currentFilters.education) query.append('education', currentFilters.education);
      if (currentFilters.minFitScore !== undefined) query.append('minFitScore', String(currentFilters.minFitScore));
      if (currentFilters.maxFitScore !== undefined) query.append('maxFitScore', String(currentFilters.maxFitScore));
      if (currentFilters.applicationDateStart) query.append('applicationDateStart', currentFilters.applicationDateStart.toISOString());
      if (currentFilters.applicationDateEnd) query.append('applicationDateEnd', currentFilters.applicationDateEnd.toISOString());
      if (currentFilters.recruiterId && currentFilters.recruiterId !== "__ALL_RECRUITERS__") query.append('recruiterId', currentFilters.recruiterId);
      // attributePath and attributeValue are not standard filters for candidates list

      const response = await fetch(`/api/candidates?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        const errorMessage = errorData.message || `Failed to fetch candidates: ${response.statusText || `Status: ${response.status}`}`;
        if (response.status === 401) {
            setAuthError(true);
            signIn(undefined, { callbackUrl: pathname });
            return;
        }
        if (response.status === 403) {
            setPermissionError(true);
            setFetchError(errorMessage);
            setAllCandidates([]);
            return;
        }
        setFetchError(errorMessage);
        setAllCandidates([]);
        return;
      }
      const data: Candidate[] = await response.json();
      setAllCandidates(data);
    } catch (error) {
      const errorMessage = (error as Error).message || "Could not load candidate data.";
       if (!(errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden"))) {
        setFetchError(errorMessage);
      }
      setAllCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, pathname, signIn]);

  const handleAiSearch = async (aiQuery: string) => {
    if (!aiQuery.trim()) {
      toast({ title: "Empty Query", description: "Please enter a search query for AI search.", variant: "default" });
      return;
    }
    setIsAiSearching(true);
    setFetchError(null);
    setAiSearchReasoning(null);
    setAiMatchedCandidateIds(null);
    try {
      const response = await fetch('/api/ai/search-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `AI search failed with status: ${response.status}`);
      }
      setAiMatchedCandidateIds(result.matchedCandidateIds || []);
      setAiSearchReasoning(result.aiReasoning || "AI search complete.");
      if (result.matchedCandidateIds?.length > 0) {
        toast({ title: "AI Search Complete", description: `Found ${result.matchedCandidateIds.length} potential match(es). ${result.aiReasoning || ''}` });
      } else {
        toast({ title: "AI Search Complete", description: result.aiReasoning || "No strong matches found by AI for your query.", variant: "default" });
      }
    } catch (error) {
      console.error("AI Search Error:", error);
      toast({ title: "AI Search Error", description: (error as Error).message, variant: "destructive" });
      setAiMatchedCandidateIds([]); 
    } finally {
      setIsAiSearching(false);
    }
  };

  useEffect(() => {
    setIsLoading(initialCandidates.length === 0 && !initialFetchError); // Only set loading if initial data wasn't provided or there was an error
    if (sessionStatus === 'authenticated' && !serverAuthError && !serverPermissionError) {
      fetchRecruiters(); // Fetch recruiters on client side
      if (initialCandidates.length === 0 && !initialFetchError) { // Fetch candidates if not pre-loaded
        fetchFilteredCandidatesOnClient(filters);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, serverAuthError, serverPermissionError, fetchRecruiters]); 


   useEffect(() => {
    if (sessionStatus === 'unauthenticated' && !serverAuthError && !serverPermissionError) {
        signIn(undefined, { callbackUrl: pathname });
    }
  }, [sessionStatus, pathname, serverAuthError, serverPermissionError, signIn]);

  useEffect(() => { setAllCandidates(initialCandidates || []); }, [initialCandidates]);
  useEffect(() => { setAvailablePositions(initialAvailablePositions || []); }, [initialAvailablePositions]);
  useEffect(() => { setAvailableStages(initialAvailableStages || []); }, [initialAvailableStages]);


  const handleFilterChange = (newFilters: CandidateFilterValues) => {
    const combinedFilters = { ...filters, ...newFilters, aiSearchQuery: undefined };
    setFilters(combinedFilters); 
    setAiMatchedCandidateIds(null);
    setAiSearchReasoning(null);
    fetchFilteredCandidatesOnClient(combinedFilters);
  };

  const fetchCandidateById = useCallback(async (candidateId: string): Promise<Candidate | null> => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Failed to fetch candidate ${candidateId}: ${errorData.message || response.statusText}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching candidate ${candidateId}:`, error);
      return null;
    }
  }, []);

  const refreshCandidateInList = useCallback(async (candidateId: string) => {
    if (aiMatchedCandidateIds !== null) {
        toast({title: "AI Search Active", description: "Please clear AI search or re-run it to see specific updates.", variant: "default" });
        // Optionally, refetch the entire list if AI search results are displayed
        // fetchFilteredCandidatesOnClient(filters); 
        return;
    }

    const updatedCandidate = await fetchCandidateById(candidateId);
    if (updatedCandidate) {
      setAllCandidates(prev => prev.map(c => c.id === candidateId ? updatedCandidate : c));
    } else {
      toast({ title: "Refresh Error", description: `Could not refresh data for candidate ${candidateId}. Attempting full list refresh.`, variant: "destructive"});
      fetchFilteredCandidatesOnClient(filters);
    }
  }, [fetchCandidateById, toast, fetchFilteredCandidatesOnClient, filters, aiMatchedCandidateIds]);

  const handleUpdateCandidateAPI = async (candidateId: string, status: CandidateStatus, transitionNotes?: string) => {
    try {
      const payload: { status: CandidateStatus, transitionNotes?: string } = { status };
      if (transitionNotes) {
        payload.transitionNotes = transitionNotes;
      }
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to update candidate: ${response.statusText || `Status: ${response.status}`}`);
      }
      const updatedCandidateFromServer: Candidate = await response.json();
      setAllCandidates(prev => prev.map(c => (c.id === updatedCandidateFromServer.id ? updatedCandidateFromServer : c)));
      toast({ title: "Candidate Updated", description: `${updatedCandidateFromServer.name}'s status set to ${updatedCandidateFromServer.status}.` });
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast({ title: "Error Updating Candidate", description: (error as Error).message, variant: "destructive" });
      throw error; // Re-throw for ManageTransitionsModal or other callers to handle
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
     try {
      const response = await fetch(`/api/candidates/${candidateId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to delete candidate: ${response.statusText || `Status: ${response.status}`}`);
      }
      setAllCandidates(prev => prev.filter(c => c.id !== candidateId));
      setSelectedCandidateIds(prev => { const newSet = new Set(prev); newSet.delete(candidateId); return newSet; });
      toast({ title: "Candidate Deleted", description: `Candidate successfully deleted.` });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast({ title: "Error Deleting Candidate", description: (error as Error).message, variant: "destructive" });
      throw error; // Re-throw for table to handle
    }
  };

  const handleAddCandidateSubmit = async (formData: AddCandidateFormValues) => {
    setIsLoading(true);
    try {
      const apiPayload = {
        // Name and email derived from parsedData or top-level fields
        name: `${formData.personal_info.firstname} ${formData.personal_info.lastname}`.trim(),
        email: formData.contact_info.email,
        phone: formData.contact_info.phone || null,
        positionId: formData.positionId,
        fitScore: formData.fitScore || 0,
        status: formData.status,
        parsedData: {
          cv_language: formData.cv_language,
          personal_info: formData.personal_info,
          contact_info: formData.contact_info,
          education: formData.education,
          experience: formData.experience?.map(exp => ({
            ...exp,
            postition_level: exp.postition_level === "___NOT_SPECIFIED___" ? undefined : exp.postition_level
          })),
          skills: formData.skills?.map(s => ({
            segment_skill: s.segment_skill,
            skill: s.skill_string?.split(',').map(sk => sk.trim()).filter(sk => sk) || []
          })),
          job_suitable: formData.job_suitable,
        }
      };
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to add candidate: ${response.statusText || `Status: ${response.status}`}`);
      }
      const newCandidate: Candidate = await response.json();
      setAllCandidates(prev => [newCandidate, ...prev].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      setIsAddModalOpen(false);
      toast({ title: "Candidate Added", description: `${newCandidate.name} has been successfully added.` });
    } catch (error) {
        console.error("Error adding candidate:", error);
        toast({ title: "Error Adding Candidate", description: (error as Error).message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleOpenUploadModal = (candidate: Candidate) => {
    setSelectedCandidateForUpload(candidate);
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (updatedCandidate: Candidate) => {
    refreshCandidateInList(updatedCandidate.id);
    toast({ title: "Resume Uploaded", description: `Resume for ${updatedCandidate.name} successfully updated.`});
  };

  const handleAutomatedProcessingStart = () => {
    toast({ title: "Processing Started", description: "Resume sent for automated processing. Candidate list will refresh if successful." });
    setTimeout(() => { fetchFilteredCandidatesOnClient(filters); }, 15000); // Optimistic refresh after 15s
  };

  const handleDownloadCsvTemplateGuide = () => {
    const headers = [
      "name", "email", "phone", "positionId", "fitScore", "status", "applicationDate",
      "parsedData.cv_language",
      "parsedData.personal_info.firstname", "parsedData.personal_info.lastname",
      "parsedData.personal_info.title_honorific", "parsedData.personal_info.nickname",
      "parsedData.personal_info.location", "parsedData.personal_info.introduction_aboutme",
      "parsedData.contact_info.email", "parsedData.contact_info.phone",
      "parsedData.education", "parsedData.experience", "parsedData.skills",
      "parsedData.job_suitable", "parsedData.job_matches"
    ];
    const exampleRows = [
      ["John Doe", "john.doe@example.com", "555-1212", "your-position-uuid-here", "85", "Applied", new Date().toISOString(),
       "EN", "John", "Doe", "Mr.", "Johnny", "New York, USA", "Experienced software engineer.",
       "john.doe@example.com", "555-1212",
       JSON.stringify([{university:"Tech U",major:"CS"}]),
       JSON.stringify([{company:"Big Tech Inc.",position:"Dev"}]),
       JSON.stringify([{segment_skill:"Languages",skill:["Python","JS"]}]),
       JSON.stringify([{suitable_career:"Software Development"}]),
       JSON.stringify([{job_title:"Senior Dev",fit_score:90}])
      ],
    ];
     let csvContent = headers.join(',') + '\n';
    exampleRows.forEach(row => {
        csvContent += row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    csvContent += "\nNOTE: For array fields, provide a valid JSON string representation of the array of objects, or leave blank (e.g., []).";

    downloadFile(csvContent, 'candidates_template.csv', 'text/csv;charset=utf-8;');
    toast({ title: "Template Guide Downloaded", description: "A CSV template for candidates has been downloaded." });
  };

  const handleExportToCsv = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.name) query.append('name', filters.name);
      if (filters.email) query.append('email', filters.email);
      if (filters.phone) query.append('phone', filters.phone);
      if (filters.positionId && filters.positionId !== "__ALL_POSITIONS__") query.append('positionId', filters.positionId);
      if (filters.status && filters.status !== "all") query.append('status', filters.status);
      if (filters.education) query.append('education', filters.education);
      if (filters.minFitScore !== undefined) query.append('minFitScore', String(filters.minFitScore));
      if (filters.maxFitScore !== undefined) query.append('maxFitScore', String(filters.maxFitScore));
      if (filters.applicationDateStart) query.append('applicationDateStart', filters.applicationDateStart.toISOString());
      if (filters.applicationDateEnd) query.append('applicationDateEnd', filters.applicationDateEnd.toISOString());
      if (filters.recruiterId && filters.recruiterId !== "__ALL_RECRUITERS__") query.append('recruiterId', filters.recruiterId);

      const response = await fetch(`/api/candidates/export?${query.toString()}`);
      if (!response.ok) { 
        const errorData = await response.json().catch(() => ({ message: "Error exporting candidate data." }));
        throw new Error(errorData.message);
      }
      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'candidates_export.csv';
      downloadFile(await blob.text(), filename, blob.type);

      toast({ title: "Export Successful", description: "Candidates exported as CSV." });
    } catch (error) { 
      toast({ title: "Export Failed", description: (error as Error).message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleOpenEditPositionModal = (position: Position) => {
    setSelectedPositionForEdit(position);
    setIsEditPositionModalOpen(true);
  };

  const handlePositionEdited = async () => {
    toast({ title: "Position Updated", description: "Position details have been saved." });
    setIsEditPositionModalOpen(false);
    if (sessionStatus === 'authenticated') {
        const posResponse = await fetch('/api/positions'); // Re-fetch all positions
        if (posResponse.ok) setAvailablePositions(await posResponse.json());
        fetchFilteredCandidatesOnClient(filters); // Refresh candidates list
    }
  };

  const handleToggleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const displayedCandidates = useMemo(() => {
    return aiMatchedCandidateIds !== null
      ? allCandidates.filter(c => aiMatchedCandidateIds.includes(c.id))
      : allCandidates;
  }, [allCandidates, aiMatchedCandidateIds]);


  const handleToggleSelectAllCandidates = () => {
    if (selectedCandidateIds.size === displayedCandidates.length && displayedCandidates.length > 0) {
      setSelectedCandidateIds(new Set());
    } else {
      setSelectedCandidateIds(new Set(displayedCandidates.map(c => c.id)));
    }
  };

  const isAllCandidatesSelected = useMemo(() => {
    if (displayedCandidates.length === 0) return false;
    return selectedCandidateIds.size === displayedCandidates.length;
  }, [selectedCandidateIds, displayedCandidates]);

  const handleBulkAction = (action: 'delete' | 'change_status' | 'assign_recruiter') => {
    setBulkActionType(action);
    if (action === 'change_status') {
      setBulkNewStatus(availableStages.find(s => s.name === 'Applied')?.name || availableStages[0]?.name || '');
    } else if (action === 'assign_recruiter') {
      setBulkNewRecruiterId(availableRecruiters[0]?.id || null);
    }
    setBulkTransitionNotes('');
    setIsBulkActionConfirmOpen(true);
  };

  const executeBulkAction = async () => {
    if (!bulkActionType || selectedCandidateIds.size === 0) return;
    setIsLoading(true);
    try {
      const payload: any = {
        action: bulkActionType,
        candidateIds: Array.from(selectedCandidateIds),
      };
      if (bulkActionType === 'change_status') {
        payload.newStatus = bulkNewStatus;
        payload.notes = bulkTransitionNotes;
      } else if (bulkActionType === 'assign_recruiter') {
        payload.newRecruiterId = bulkNewRecruiterId;
      }

      const response = await fetch('/api/candidates/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Bulk action failed');
      
      toast({ title: "Bulk Action Successful", description: `${result.successCount} candidate(s) affected. ${result.failCount > 0 ? `${result.failCount} failed.` : ''}`});
      setSelectedCandidateIds(new Set()); // Clear selection
      fetchFilteredCandidatesOnClient(filters); // Refresh list
    } catch (error) {
      toast({ title: "Bulk Action Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsBulkActionConfirmOpen(false);
      setBulkActionType(null);
    }
  };


  if (authError) {
    return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">You need to be signed in to view this page.</p> <Button onClick={() => signIn(undefined, { callbackUrl: pathname })} className="btn-hover-primary-gradient">Sign In</Button> </div> );
  }
  if (permissionError) {
     return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Permission Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">{fetchError || "You do not have sufficient permissions to view this page."}</p> <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button> </div> );
  }
  if (sessionStatus === 'loading' || (isLoading && allCandidates.length === 0 && !fetchError)) {
    return ( <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div> );
  }

  if (fetchError && !isLoading) {
    const isMissingTableError = fetchError.toLowerCase().includes("relation") && fetchError.toLowerCase().includes("does not exist");
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Candidates</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isMissingTableError && ( <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-md text-sm"> <p className="font-semibold">It looks like a required database table (e.g., "Candidate", "Position", "User", "RecruitmentStage") is missing or not accessible.</p> <p className="mt-1">This usually means the database initialization script (`pg-init-scripts/init-db.sql`) did not run correctly when the PostgreSQL Docker container started.</p> <p className="mt-2">Please refer to the troubleshooting steps in the `README.md` for guidance on how to resolve this, typically involving a clean Docker volume reset.</p> </div> )}
        <Button onClick={() => fetchFilteredCandidatesOnClient(filters)} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full"> 
      <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 md:sticky md:top-0 md:h-screen">
        <ScrollArea className="h-full md:max-h-[calc(100vh-var(--header-height,4rem)-2rem)] md:pr-2"> 
          <div className="flex justify-between items-center mb-3 md:hidden">
            <h1 className="text-xl font-semibold">Filters</h1>
          </div>
          <CandidateFilters
            initialFilters={filters}
            onFilterChange={handleFilterChange}
            onAiSearch={handleAiSearch}
            availablePositions={availablePositions}
            availableStages={availableStages}
            availableRecruiters={availableRecruiters}
            isLoading={isLoading || isAiSearching}
            isAiSearching={isAiSearching}
          />
        </ScrollArea>
      </aside>

      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground hidden md:block"> Candidate Management </h1>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 items-center sm:justify-end">
            {selectedCandidateIds.size > 0 && canManageCandidates && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Bulk Actions ({selectedCandidateIds.size}) <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
                    <BulkTrashIcon className="mr-2 h-4 w-4" /> Delete Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('change_status')}>
                    <BulkEditIcon className="mr-2 h-4 w-4" /> Change Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('assign_recruiter')}>
                     <Users className="mr-2 h-4 w-4" /> Assign Recruiter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canManageCandidates && (
                <Button onClick={() => setIsCreateViaN8nModalOpen(true)} className="w-full sm:w-auto btn-primary-gradient"> <Zap className="mr-2 h-4 w-4" /> Create via Resume </Button>
            )}
            <DropdownMenu>
               <DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto"> More Actions <ChevronDown className="ml-2 h-4 w-4" /> </Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canManageCandidates && (<DropdownMenuItem onClick={() => setIsAddModalOpen(true)}> <PlusCircle className="mr-2 h-4 w-4" /> Add Manually </DropdownMenuItem>)}
                {canImportCandidates && (<DropdownMenuItem onClick={() => setIsImportModalOpen(true)}> <FileUp className="mr-2 h-4 w-4" /> Import (CSV) </DropdownMenuItem>)}
                {canImportCandidates && (<DropdownMenuItem onClick={handleDownloadCsvTemplateGuide}> <FileDown className="mr-2 h-4 w-4" /> Download CSV Template </DropdownMenuItem>)}
                {canExportCandidates && (<DropdownMenuItem onClick={handleExportToCsv} disabled={isLoading}> <FileSpreadsheet className="mr-2 h-4 w-4" /> Export (CSV) </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {aiSearchReasoning && (
          <Alert variant="default" className="bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300">AI Search Results</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              {aiSearchReasoning}
              {aiMatchedCandidateIds && aiMatchedCandidateIds.length === 0 && " No strong matches found."}
            </AlertDescription>
          </Alert>
        )}

        {(isLoading || isAiSearching) && displayedCandidates.length === 0 && !fetchError ? ( <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card shadow"> <Users className="w-16 h-16 text-muted-foreground animate-pulse mb-4" /> <h3 className="text-xl font-semibold text-foreground"> {isAiSearching ? "AI Searching Candidates..." : "Loading Candidates..."}</h3> <p className="text-muted-foreground">Please wait while we fetch the data.</p> </div>
        ) : (
          <CandidateTable 
            candidates={displayedCandidates} 
            availablePositions={availablePositions} 
            availableStages={availableStages} 
            onUpdateCandidate={handleUpdateCandidateAPI} 
            onDeleteCandidate={handleDeleteCandidate} 
            onOpenUploadModal={handleOpenUploadModal} 
            onEditPosition={handleOpenEditPositionModal} 
            isLoading={(isLoading || isAiSearching) && displayedCandidates.length > 0 && !fetchError} 
            onRefreshCandidateData={refreshCandidateInList}
            selectedCandidateIds={selectedCandidateIds}
            onToggleSelectCandidate={handleToggleSelectCandidate}
            onToggleSelectAllCandidates={handleToggleSelectAllCandidates}
            isAllCandidatesSelected={isAllCandidatesSelected}
          />
        )}
      </div>

      {canManageCandidates && <AddCandidateModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} onAddCandidate={handleAddCandidateSubmit} availablePositions={availablePositions} availableStages={availableStages} />}
      {canManageCandidates && <UploadResumeModal isOpen={isUploadModalOpen} onOpenChange={setIsUploadModalOpen} candidate={selectedCandidateForUpload} onUploadSuccess={handleUploadSuccess} />}
      {canManageCandidates && <CreateCandidateViaN8nModal isOpen={isCreateViaN8nModalOpen} onOpenChange={setIsCreateViaN8nModalOpen} onProcessingStart={handleAutomatedProcessingStart} />}
      {canImportCandidates && <ImportCandidatesModal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImportSuccess={() => fetchFilteredCandidatesOnClient(filters)} />}
      {selectedPositionForEdit && ( <EditPositionModal isOpen={isEditPositionModalOpen} onOpenChange={(isOpen) => { setIsEditPositionModalOpen(isOpen); if (!isOpen) setSelectedPositionForEdit(null); }} position={selectedPositionForEdit} onEditPosition={handlePositionEdited} /> )}
    
      <AlertDialog open={isBulkActionConfirmOpen} onOpenChange={setIsBulkActionConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to perform <strong>{bulkActionType?.replace('_', ' ')}</strong> on <strong>{selectedCandidateIds.size}</strong> selected candidate(s).
              {bulkActionType === 'delete' && " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkActionType === 'change_status' && (
            <div className="my-4 space-y-2">
              <Label htmlFor="bulk-new-status">New Status</Label>
              <Select value={bulkNewStatus} onValueChange={setBulkNewStatus}>
                <SelectTrigger id="bulk-new-status"><SelectValue /></SelectTrigger>
                <SelectContent>{availableStages.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <Label htmlFor="bulk-transition-notes">Notes (Optional)</Label>
              <Textarea id="bulk-transition-notes" value={bulkTransitionNotes} onChange={(e) => setBulkTransitionNotes(e.target.value)} placeholder="Optional notes for this bulk status change."/>
            </div>
          )}
          {bulkActionType === 'assign_recruiter' && (
             <div className="my-4 space-y-2">
              <Label htmlFor="bulk-new-recruiter">Assign to Recruiter</Label>
              <Select value={bulkNewRecruiterId || ''} onValueChange={(value) => setBulkNewRecruiterId(value === '___UNASSIGN___' ? null : value)}>
                <SelectTrigger id="bulk-new-recruiter"><SelectValue placeholder="Select recruiter..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="___UNASSIGN___">Unassign</SelectItem>
                    {availableRecruiters.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setIsBulkActionConfirmOpen(false); setBulkActionType(null);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null} Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
