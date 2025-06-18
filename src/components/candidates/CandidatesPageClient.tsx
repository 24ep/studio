
// src/components/candidates/CandidatesPageClient.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import type { Candidate, CandidateStatus, Position, RecruitmentStage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, Users, ServerCrash, Zap, Loader2, FileDown, FileUp, ChevronDown, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AddCandidateModal, type AddCandidateFormValues } from '@/components/candidates/AddCandidateModal';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal';
import { CreateCandidateViaN8nModal } from '@/components/candidates/CreateCandidateViaN8nModal';
import { ImportCandidatesModal } from '@/components/candidates/ImportCandidatesModal';
import { EditPositionModal } from '@/components/positions/EditPositionModal';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

interface CandidatesPageClientProps {
  initialCandidates: Candidate[];
  initialAvailablePositions: Position[];
  initialAvailableStages: RecruitmentStage[];
  authError?: boolean;
  permissionError?: boolean;
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
}: CandidatesPageClientProps) {
  const [filters, setFilters] = useState<CandidateFilterValues>({ minFitScore: 0, maxFitScore: 100, positionId: "__ALL_POSITIONS__", status: "all" });
  
  const [allCandidates, setAllCandidates] = useState<Candidate[]>(initialCandidates || []);
  const [availablePositions, setAvailablePositions] = useState<Position[]>(initialAvailablePositions || []);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>(initialAvailableStages || []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateViaN8nModalOpen, setIsCreateViaN8nModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCandidateForUpload, setSelectedCandidateForUpload] = useState<Candidate | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(serverAuthError);
  const [permissionError, setPermissionError] = useState(serverPermissionError);

  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);
  const { data: session, status: sessionStatus } = useSession();

  const canImportCandidates = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('CANDIDATES_IMPORT');
  const canExportCandidates = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('CANDIDATES_EXPORT');


  const fetchFilteredCandidatesOnClient = useCallback(async (currentFilters: CandidateFilterValues) => {
    if (sessionStatus !== 'authenticated') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);
    setPermissionError(false);

    try {
      const query = new URLSearchParams();
      if (currentFilters.name) query.append('name', currentFilters.name);
      if (currentFilters.positionId && currentFilters.positionId !== "__ALL_POSITIONS__") query.append('positionId', currentFilters.positionId);
      if (currentFilters.status && currentFilters.status !== "all") query.append('status', currentFilters.status);
      if (currentFilters.education) query.append('education', currentFilters.education);
      if (currentFilters.minFitScore !== undefined) query.append('minFitScore', String(currentFilters.minFitScore));
      if (currentFilters.maxFitScore !== undefined) query.append('maxFitScore', String(currentFilters.maxFitScore));

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

  useEffect(() => {
    if (sessionStatus === 'authenticated' && !serverAuthError && !serverPermissionError) {
      fetchFilteredCandidatesOnClient(filters);
    }
  }, [filters, sessionStatus, serverAuthError, serverPermissionError, fetchFilteredCandidatesOnClient]);

   useEffect(() => {
    if (sessionStatus === 'unauthenticated' && !serverAuthError && !serverPermissionError) {
        signIn(undefined, { callbackUrl: pathname });
    }
  }, [sessionStatus, pathname, serverAuthError, serverPermissionError, signIn]);

  useEffect(() => { setAllCandidates(initialCandidates || []); }, [initialCandidates]);
  useEffect(() => { setAvailablePositions(initialAvailablePositions || []); }, [initialAvailablePositions]);
  useEffect(() => { setAvailableStages(initialAvailableStages || []); }, [initialAvailableStages]);


  const handleFilterChange = (newFilters: CandidateFilterValues) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters}));
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
    const updatedCandidate = await fetchCandidateById(candidateId);
    if (updatedCandidate) {
      setAllCandidates(prev => prev.map(c => c.id === candidateId ? updatedCandidate : c));
    } else {
      toast({ title: "Refresh Error", description: `Could not refresh data for candidate ${candidateId}. Attempting full list refresh.`, variant: "destructive"});
      fetchFilteredCandidatesOnClient(filters);
    }
  }, [fetchCandidateById, toast, fetchFilteredCandidatesOnClient, filters]);

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
      throw error;
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
      toast({ title: "Candidate Deleted", description: `Candidate successfully deleted.` });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast({ title: "Error Deleting Candidate", description: (error as Error).message, variant: "destructive" });
      throw error;
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
    setTimeout(() => { fetchFilteredCandidatesOnClient(filters); }, 15000);
  };
  
  const handleDownloadCsvTemplateGuide = () => {
    const headers = [
      "name", "email", "phone", "positionId", "fitScore", "status", "applicationDate",
      "parsedData.cv_language",
      "parsedData.personal_info.firstname", "parsedData.personal_info.lastname",
      "parsedData.personal_info.title_honorific", "parsedData.personal_info.nickname",
      "parsedData.personal_info.location", "parsedData.personal_info.introduction_aboutme",
      "parsedData.contact_info.email", "parsedData.contact_info.phone", // These might be redundant if same as main email/phone
      "parsedData.education", // Expect JSON string
      "parsedData.experience", // Expect JSON string
      "parsedData.skills", // Expect JSON string
      "parsedData.job_suitable", // Expect JSON string
      "parsedData.job_matches" // Expect JSON string
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
      ["Jane Smith", "jane.smith@example.com", "555-0011", "", "70", "Screening", new Date().toISOString(),
       "EN", "Jane", "Smith", "Ms.", "", "London, UK", "Product enthusiast.",
       "jane.smith@example.com", "555-0011",
       "[]", "[]", "[]", "[]", "[]"
      ]
    ];
     let csvContent = headers.join(',') + '\n';
    exampleRows.forEach(row => {
        csvContent += row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    csvContent += "\nNOTE: For array fields (education, experience, skills, job_suitable, job_matches), provide a valid JSON string representation of the array of objects, or leave blank (e.g., []).";

    downloadFile(csvContent, 'candidates_template.csv', 'text/csv;charset=utf-8;');
    toast({
      title: "Template Guide Downloaded",
      description: "A CSV template for candidates has been downloaded.",
    });
  };

  const handleExportToCsv = async () => { 
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.name) query.append('name', filters.name);
      if (filters.positionId && filters.positionId !== "__ALL_POSITIONS__") query.append('positionId', filters.positionId);
      if (filters.status && filters.status !== "all") query.append('status', filters.status);


      const response = await fetch(`/api/candidates/export?${query.toString()}`);
      if (!response.ok) { throw new Error("Export failed"); }
      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'candidates_export.csv';
      downloadFile(await blob.text(), filename, blob.type);

      toast({ title: "Export Successful", description: "Candidates exported as CSV." });
    } catch (error) { toast({ title: "Export Failed", description: (error as Error).message, variant: "destructive" });
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
        const posResponse = await fetch('/api/positions');
        if (posResponse.ok) setAvailablePositions(await posResponse.json());
        fetchFilteredCandidatesOnClient(filters);
    }
  };

  if (authError) {
    return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">You need to be signed in to view this page.</p> <Button onClick={() => signIn(undefined, { callbackUrl: pathname })} className="btn-hover-primary-gradient">Sign In</Button> </div> );
  }
  if (permissionError) {
     return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Permission Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">{fetchError || "You do not have sufficient permissions to view this page."}</p> <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button> </div> );
  }

  if (fetchError) {
    const isMissingTableError = fetchError.toLowerCase().includes("relation") && fetchError.toLowerCase().includes("does not exist");
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Candidates</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isMissingTableError && ( <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-md text-sm"> <p className="font-semibold">It looks like a required database table (or a related one) is missing.</p> <p className="mt-1">This usually means the database initialization script (`pg-init-scripts/init-db.sql`) did not run correctly.</p> <p className="mt-2">Please refer to the troubleshooting steps in the `README.md` for guidance on how to resolve this.</p> </div> )}
        <Button onClick={() => fetchFilteredCandidatesOnClient(filters)} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <h1 className="text-2xl font-semibold text-foreground hidden md:block"> Candidate Management </h1>
        <div className="w-full flex flex-col sm:flex-row gap-2 items-center sm:justify-end">
          <Button onClick={() => setIsCreateViaN8nModalOpen(true)} className="w-full sm:w-auto btn-primary-gradient"> <Zap className="mr-2 h-4 w-4" /> Create via Resume (Automated) </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto"> More Actions <ChevronDown className="ml-2 h-4 w-4" /> </Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddModalOpen(true)}> <PlusCircle className="mr-2 h-4 w-4" /> Add Candidate Manually </DropdownMenuItem>
              {canImportCandidates && (<DropdownMenuItem onClick={() => setIsImportModalOpen(true)}> <FileUp className="mr-2 h-4 w-4" /> Import Candidates (CSV) </DropdownMenuItem>)}
              {canImportCandidates && (<DropdownMenuItem onClick={handleDownloadCsvTemplateGuide}> <FileDown className="mr-2 h-4 w-4" /> Download CSV Template </DropdownMenuItem>)}
              {canExportCandidates && (<DropdownMenuItem onClick={handleExportToCsv} disabled={isLoading}> <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Candidates (CSV) </DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CandidateFilters initialFilters={filters} onFilterChange={handleFilterChange} availablePositions={availablePositions} availableStages={availableStages} isLoading={isLoading && allCandidates.length > 0} />

      {isLoading && allCandidates.length === 0 && !fetchError ? ( <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card shadow"> <Users className="w-16 h-16 text-muted-foreground animate-pulse mb-4" /> <h3 className="text-xl font-semibold text-foreground">Loading Candidates...</h3> <p className="text-muted-foreground">Please wait while we fetch the data.</p> </div>
      ) : (
        <CandidateTable candidates={allCandidates} availablePositions={availablePositions} availableStages={availableStages} onUpdateCandidate={handleUpdateCandidateAPI} onDeleteCandidate={handleDeleteCandidate} onOpenUploadModal={handleOpenUploadModal} onEditPosition={handleOpenEditPositionModal} isLoading={isLoading && allCandidates.length > 0 && !fetchError} onRefreshCandidateData={refreshCandidateInList} />
      )}

      <AddCandidateModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} onAddCandidate={handleAddCandidateSubmit} availablePositions={availablePositions} availableStages={availableStages} />
      <UploadResumeModal isOpen={isUploadModalOpen} onOpenChange={setIsUploadModalOpen} candidate={selectedCandidateForUpload} onUploadSuccess={handleUploadSuccess} />
      <CreateCandidateViaN8nModal isOpen={isCreateViaN8nModalOpen} onOpenChange={setIsCreateViaN8nModalOpen} onProcessingStart={handleAutomatedProcessingStart} />
      <ImportCandidatesModal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImportSuccess={() => fetchFilteredCandidatesOnClient(filters)} />
      {selectedPositionForEdit && ( <EditPositionModal isOpen={isEditPositionModalOpen} onOpenChange={(isOpen) => { setIsEditPositionModalOpen(isOpen); if (!isOpen) setSelectedPositionForEdit(null); }} position={selectedPositionForEdit} onEditPosition={handlePositionEdited} /> )}
    </div>
  );
}
