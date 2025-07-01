// src/components/candidates/CandidatesPageClient.tsx
"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import type { Candidate, CandidateStatus, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PlusCircle, Users, ServerCrash, Zap, Loader2, FileDown, FileUp, ChevronDown, FileSpreadsheet, ShieldAlert, Brain, Trash2 as BulkTrashIcon, Edit as BulkEditIcon } from 'lucide-react';
import { toast } from "react-hot-toast";
import { AddCandidateModal, type AddCandidateFormValues } from '@/components/candidates/AddCandidateModal';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal';
import { CreateCandidateViaAutomationModal } from '@/components/candidates/CreateCandidateViaAutomationModal';
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
  const [filters, setFilters] = useState<CandidateFilterValues>({ 
    minFitScore: 0, 
    maxFitScore: 100, 
    selectedPositionIds: [], 
    selectedStatuses: [] 
  });

  const safeInitialCandidates = Array.isArray(initialCandidates) ? initialCandidates : [];
  const safeInitialAvailablePositions = Array.isArray(initialAvailablePositions) ? initialAvailablePositions : [];
  const safeInitialAvailableStages = Array.isArray(initialAvailableStages) ? initialAvailableStages : [];

  const [allCandidates, setAllCandidates] = useState<Candidate[]>(safeInitialCandidates || []);
  const [availablePositions, setAvailablePositions] = useState<Position[]>(safeInitialAvailablePositions || []);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>(safeInitialAvailableStages || []);
  const [availableRecruiters, setAvailableRecruiters] = useState<Pick<UserProfile, 'id' | 'name'>[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchReasoning, setAiSearchReasoning] = useState<string | null>(null);
  const [aiMatchedCandidateIds, setAiMatchedCandidateIds] = useState<string[] | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateViaAutomationModalOpen, setIsCreateViaAutomationModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCandidateForUpload, setSelectedCandidateForUpload] = useState<Candidate | null>(null);
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

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const canImportCandidates = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('CANDIDATES_IMPORT');
  const canExportCandidates = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('CANDIDATES_EXPORT');
  const canManageCandidates = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('CANDIDATES_MANAGE');


  const fetchRecruiters = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    try {
      const response = await fetch('/api/users?role=Recruiter');
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Default to empty object on JSON parse fail
          console.error("API error fetching recruiters:", errorData); // Log the object we got
          
          let detailedErrorMessage = (errorData as any)?.message || 'Failed to fetch recruiters';
          if (Object.keys(errorData).length === 0 && !(errorData as any)?.message) {
            // If errorData is empty and has no message, use statusText
            detailedErrorMessage = `Failed to fetch recruiters. Server responded with status ${response.status}: ${response.statusText || 'No additional error message.'}`;
          } else if ((errorData as any)?.error) { // If there's an 'error' property in the JSON
            detailedErrorMessage += ` (Details: ${(errorData as any).error})`;
          }
          if ((errorData as any).code) { // If there's a 'code' property
             detailedErrorMessage += ` (Code: ${(errorData as any).code})`;
          }
          throw new Error(detailedErrorMessage);
      }
      const recruitersData: UserProfile[] | undefined = await response.json(); 
      if (!recruitersData || !Array.isArray(recruitersData)) {
        throw new Error('Invalid data format received for recruiters.');
      }
      setAvailableRecruiters(recruitersData.map(r => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      toast.error(`Could not load recruiters: ${(error as Error).message}`);
    }
  }, [sessionStatus]);


  const fetchPaginatedCandidates = useCallback(async (currentFilters: CandidateFilterValues, page: number, pageSize: number) => {
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
      if (currentFilters.selectedPositionIds && currentFilters.selectedPositionIds.length > 0) query.append('positionId', currentFilters.selectedPositionIds.join(','));
      if (currentFilters.selectedStatuses && currentFilters.selectedStatuses.length > 0) query.append('status', currentFilters.selectedStatuses.join(','));
      if (currentFilters.education) query.append('education', currentFilters.education);
      if (currentFilters.minFitScore !== undefined) query.append('minFitScore', String(currentFilters.minFitScore));
      if (currentFilters.maxFitScore !== undefined) query.append('maxFitScore', String(currentFilters.maxFitScore));
      if (currentFilters.applicationDateStart) query.append('applicationDateStart', currentFilters.applicationDateStart.toISOString());
      if (currentFilters.applicationDateEnd) query.append('applicationDateEnd', currentFilters.applicationDateEnd.toISOString());
      if (currentFilters.selectedRecruiterIds && currentFilters.selectedRecruiterIds.length > 0) query.append('recruiterId', currentFilters.selectedRecruiterIds.join(','));
      query.append('page', String(page));
      query.append('limit', String(pageSize));
      const response = await fetch(`/api/candidates?${query.toString()}`);
      if (!response.ok) {
        let errorData: any = {};
        let errorMessageFromServer = null;
        try {
          errorData = await response.json();
          errorMessageFromServer = errorData?.message || errorData?.error;
        } catch (e) {}
        let errorMessage = errorMessageFromServer || `Failed to fetch candidates. Server responded with status ${response.status}: ${response.statusText || 'No additional error message.'}`;
        if (errorData?.code) {
          errorMessage += ` (Code: ${errorData.code})`;
        }
        if (response.status === 401) {
            setAuthError(true);
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
      const data = await response.json();
      setAllCandidates(Array.isArray(data.data) ? data.data : []);
      setTotal(data.total);
    } catch (error) {
      const errorMessage = (error as Error).message || "Could not load candidate data.";
       if (!(errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden"))) {
        setFetchError(errorMessage);
      }
      setAllCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus]);

  const handleAiSearch = async (aiQuery: string) => {
    if (!aiQuery.trim()) {
      toast("Please enter a search query for AI search.");
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
        toast.success(`Found ${result.matchedCandidateIds.length} potential match(es). ${result.aiReasoning || ''}`);
      } else {
        toast.success(result.aiReasoning || "No strong matches found by AI for your query.");
      }
    } catch (error) {
      console.error("AI Search Error:", error);
      toast.error((error as Error).message);
      setAiMatchedCandidateIds([]);
    } finally {
      setIsAiSearching(false);
    }
  };

  useEffect(() => {
    setIsLoading(safeInitialCandidates.length === 0 && !initialFetchError); // Only set loading if initial data wasn't provided or there was an error
    if (sessionStatus === 'authenticated' && !serverAuthError && !serverPermissionError) {
      fetchRecruiters(); // Fetch recruiters on client side
      
      // Check for URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const recruiterIdParam = urlParams.get('recruiterId');
      
      // Handle unassigned filter
      if (recruiterIdParam === 'unassigned') {
        setFilters(prev => ({
          ...prev,
          selectedRecruiterIds: ['unassigned']
        }));
      }
      
      if (safeInitialCandidates.length === 0 && !initialFetchError) { // Fetch candidates if not pre-loaded
        fetchPaginatedCandidates(filters, page, pageSize);
      }
    }
  }, [sessionStatus, serverAuthError, serverPermissionError, fetchRecruiters, fetchPaginatedCandidates, filters, safeInitialCandidates.length, initialFetchError, page, pageSize]);


  useEffect(() => {
    if (sessionStatus === 'unauthenticated' && !serverAuthError && !serverPermissionError) {
        return;
    }
  }, [sessionStatus, serverAuthError, serverPermissionError]);

  useEffect(() => { setAllCandidates(safeInitialCandidates || []); }, [safeInitialCandidates]);
  useEffect(() => { setAvailablePositions(safeInitialAvailablePositions || []); }, [safeInitialAvailablePositions]);
  useEffect(() => { setAvailableStages(safeInitialAvailableStages || []); }, [safeInitialAvailableStages]);

  useEffect(() => {
    // Show error as toast popup if present
    if (initialFetchError) {
      toast.error(initialFetchError);
    }
  }, [initialFetchError]);


  const handleFilterChange = (newFilters: CandidateFilterValues) => {
    const combinedFilters = { ...filters, ...newFilters, aiSearchQuery: undefined };
    setFilters(combinedFilters);
    setAiMatchedCandidateIds(null);
    setAiSearchReasoning(null);
    fetchPaginatedCandidates(combinedFilters, page, pageSize);
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
        toast('AI Search Active: Please clear AI search or re-run it to see specific updates.');
        return;
    }

    const updatedCandidate = await fetchCandidateById(candidateId);
    if (updatedCandidate) {
      setAllCandidates(prev => prev.map(c => c.id === candidateId ? updatedCandidate : c));
    } else {
      toast.error('Could not refresh data for candidate. Attempting full list refresh.');
      fetchPaginatedCandidates(filters, page, pageSize);
    }
  }, [fetchCandidateById, toast, fetchPaginatedCandidates, filters, page, pageSize, aiMatchedCandidateIds]);

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
      toast.success(`${updatedCandidateFromServer.name}'s status set to ${updatedCandidateFromServer.status}.`);
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast.error((error as Error).message);
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
      toast.success(`Candidate successfully deleted.`);
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast.error((error as Error).message);
      throw error; // Re-throw for table to handle
    }
  };

  const handleAddCandidateSubmit = async (formData: AddCandidateFormValues) => {
    setIsLoading(true);
    try {
      const apiPayload = {
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
            postition_level: exp.postition_level === "___NOT_SPECIFIED___" || exp.postition_level === null ? undefined : exp.postition_level
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
      toast.success(`${newCandidate.name} has been successfully added.`);
    } catch (error) {
        console.error("Error adding candidate:", error);
        toast.error((error as Error).message);
    } finally { setIsLoading(false); }
  };

  const handleOpenUploadModal = (candidate: Candidate) => {
    setSelectedCandidateForUpload(candidate);
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (updatedCandidate: Candidate) => {
    refreshCandidateInList(updatedCandidate.id);
    toast.success(`Resume for ${updatedCandidate.name} successfully updated.`);
  };

  const handleAutomatedProcessingStart = () => {
    toast('Processing Started: Resume sent for automated processing. Candidate list will refresh if successful.');
    setTimeout(() => { fetchPaginatedCandidates(filters, page, pageSize); }, 15000); // Optimistic refresh after 15s
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
    toast.success('A CSV template for candidates has been downloaded.');
  };

  const handleExportToCsv = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.name) query.append('name', filters.name);
      if (filters.email) query.append('email', filters.email);
      if (filters.phone) query.append('phone', filters.phone);
      if (filters.selectedPositionIds && filters.selectedPositionIds.length > 0) query.append('positionId', filters.selectedPositionIds.join(','));
      if (filters.selectedStatuses && filters.selectedStatuses.length > 0) query.append('status', filters.selectedStatuses.join(','));
      if (filters.education) query.append('education', filters.education);
      if (filters.minFitScore !== undefined) query.append('minFitScore', String(filters.minFitScore));
      if (filters.maxFitScore !== undefined) query.append('maxFitScore', String(filters.maxFitScore));
      if (filters.applicationDateStart) query.append('applicationDateStart', filters.applicationDateStart.toISOString());
      if (filters.applicationDateEnd) query.append('applicationDateEnd', filters.applicationDateEnd.toISOString());
      if (filters.selectedRecruiterIds && filters.selectedRecruiterIds.length > 0) query.append('recruiterId', filters.selectedRecruiterIds.join(','));


      const response = await fetch(`/api/candidates/export?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error exporting candidate data." }));
        throw new Error(errorData.message);
      }
      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'candidates_export.csv';
      downloadFile(await blob.text(), filename, blob.type);

      toast.success('Candidates exported as CSV.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally { setIsLoading(false); }
  };

  const handleOpenEditPositionModal = (position: Position) => {
    setSelectedPositionForEdit(position);
    setIsEditPositionModalOpen(true);
  };

  const handlePositionEdited = async () => {
    toast.success('Position details have been saved.');
    setIsEditPositionModalOpen(false);
    if (sessionStatus === 'authenticated') {
        const posResponse = await fetch('/api/positions'); // Re-fetch all positions
        if (posResponse.ok) setAvailablePositions(await posResponse.json());
        fetchPaginatedCandidates(filters, page, pageSize); // Refresh candidates list
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
    // Ensure allCandidates is an array before calling filter
    const candidates = Array.isArray(allCandidates) ? allCandidates : [];
    return aiMatchedCandidateIds !== null
      ? candidates.filter(c => aiMatchedCandidateIds.includes(c.id))
      : candidates;
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

      toast.success(`${result.successCount} candidate(s) affected. ${result.failCount > 0 ? `${result.failCount} failed.` : ''}`);
      setSelectedCandidateIds(new Set()); // Clear selection
      fetchPaginatedCandidates(filters, page, pageSize); // Refresh list
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
      setIsBulkActionConfirmOpen(false);
      setBulkActionType(null);
    }
  };

  // Pagination controls
  const totalPages = Math.ceil(total / pageSize);

  // Add handler for assigning recruiter inline
  const handleAssignRecruiter = async (candidateId: string, recruiterId: string | null) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to assign recruiter' }));
        throw new Error(errorData.message || 'Failed to assign recruiter');
      }
      await refreshCandidateInList(candidateId);
      toast.success('Recruiter updated.');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (sessionStatus === 'loading') {
    // Show a loading spinner while session is being established
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent any fetches or UI rendering until authenticated or error
  if (sessionStatus !== 'authenticated') {
    return null;
  }

  if (authError) {
    return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">You need to be signed in to view this page.</p> <Button onClick={() => signIn(undefined, { callbackUrl: pathname })} className="btn-primary-gradient">Sign In</Button> </div> );
  }
  if (permissionError) {
     return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Permission Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">{fetchError || "You do not have sufficient permissions to view this page."}</p> <Button onClick={() => router.push('/')} className="btn-primary-gradient">Go to Dashboard</Button> </div> );
  }
  if (isLoading && allCandidates.length === 0 && !fetchError) {
    return ( <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div> );
  }

  if (fetchError && !isLoading) {
    const isMissingTableError = fetchError.toLowerCase().includes("relation") && fetchError.toLowerCase().includes("does not exist");
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Candidates</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isMissingTableError && ( <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-md text-sm"> <p className="font-semibold">It looks like a required database table (e.g., &quot;Candidate&quot;, &quot;Position&quot;, &quot;User&quot;, &quot;RecruitmentStage&quot;) is missing or not accessible.</p> <p className="mt-1">This usually means the database initialization script (`pg-init-scripts/init-db.sql`) did not run correctly when the PostgreSQL Docker container started.</p> <p className="mt-2">Please refer to the troubleshooting steps in the `README.md` for guidance on how to resolve this, typically involving a clean Docker volume reset.</p> </div> )}
        <Button onClick={() => fetchPaginatedCandidates(filters, page, pageSize)} className="btn-primary-gradient">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <aside className="w-full md:w-[20%] flex-shrink-0 md:sticky md:top-[calc(var(--header-height,4rem)_+_1rem)] md:max-h-[calc(100vh-var(--header-height,4rem)-2rem)]">
        <ScrollArea className="h-full md:pr-2">
          <div className="flex justify-between items-center mb-3 md:hidden"> 
            <h2 className="text-lg font-semibold">Filters</h2>
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

      <div className="flex-1 md:w-[80%] space-y-6 min-w-0"> 
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
                  <DropdownMenuItem onSelect={() => handleBulkAction('delete')}>
                    <BulkTrashIcon className="mr-2 h-4 w-4" /> Delete Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleBulkAction('change_status')}>
                    <BulkEditIcon className="mr-2 h-4 w-4" /> Change Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleBulkAction('assign_recruiter')}>
                     <Users className="mr-2 h-4 w-4" /> Assign Recruiter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canManageCandidates && (
                <Button onClick={() => setIsCreateViaAutomationModalOpen(true)} className="w-full sm:w-auto btn-primary-gradient"> <Zap className="mr-2 h-4 w-4" /> Create via Resume </Button>
            )}
            <DropdownMenu>
               <DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto"> More Actions <ChevronDown className="ml-2 h-4 w-4" /> </Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canManageCandidates && (<DropdownMenuItem onSelect={() => setIsAddModalOpen(true)}> <PlusCircle className="mr-2 h-4 w-4" /> Add Manually </DropdownMenuItem>)}
                {canImportCandidates && (<DropdownMenuItem onSelect={() => setIsImportModalOpen(true)}> <FileUp className="mr-2 h-4 w-4" /> Import (CSV) </DropdownMenuItem>)}
                {canImportCandidates && (<DropdownMenuItem onSelect={handleDownloadCsvTemplateGuide}> <FileDown className="mr-2 h-4 w-4" /> Download CSV Template </DropdownMenuItem>)}
                {canExportCandidates && (<DropdownMenuItem onSelect={handleExportToCsv} disabled={isLoading}> <FileSpreadsheet className="mr-2 h-4 w-4" /> Export (CSV) </DropdownMenuItem>)}
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
            availableRecruiters={availableRecruiters}
            onAssignRecruiter={handleAssignRecruiter}
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

        <div className="flex justify-center items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={page === i + 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
        </div>
      </div>

      {canManageCandidates && <AddCandidateModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} onAddCandidate={handleAddCandidateSubmit} availablePositions={availablePositions} availableStages={availableStages} />}
      {canManageCandidates && <UploadResumeModal isOpen={isUploadModalOpen} onOpenChange={setIsUploadModalOpen} candidate={selectedCandidateForUpload} onUploadSuccess={handleUploadSuccess} />}
      {canManageCandidates && <CreateCandidateViaAutomationModal isOpen={isCreateViaAutomationModalOpen} onOpenChange={setIsCreateViaAutomationModalOpen} onProcessingStart={handleAutomatedProcessingStart} />}
      {canImportCandidates && <ImportCandidatesModal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImportSuccess={() => fetchPaginatedCandidates(filters, page, pageSize)} />}
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
              <Select value={bulkNewStatus || ''} onValueChange={setBulkNewStatus}>
                <SelectTrigger id="bulk-new-status"><SelectValue placeholder="Select status..." /></SelectTrigger>
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
