
"use client";

import { useState, useEffect, useCallback } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import type { Candidate, CandidateStatus, Position, RecruitmentStage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, Users, ServerCrash, Zap, Loader2, FileDown, FileUp, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AddCandidateModal, type AddCandidateFormValues } from '@/components/candidates/AddCandidateModal';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal';
import { CreateCandidateViaN8nModal } from '@/components/candidates/CreateCandidateViaN8nModal';
import { ImportCandidatesModal } from '@/components/candidates/ImportCandidatesModal';
import { EditPositionModal, type EditPositionFormValues } from '@/components/positions/EditPositionModal';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';


export default function CandidatesPage() {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filters, setFilters] = useState<CandidateFilterValues>({ minFitScore: 0, maxFitScore: 100, positionId: "__ALL_POSITIONS__" });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateViaN8nModalOpen, setIsCreateViaN8nModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCandidateForUpload, setSelectedCandidateForUpload] = useState<Candidate | null>(null);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);
  const { data: session, status: sessionStatus } = useSession();

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

  const fetchCandidates = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
        setIsLoading(false); // Prevent indefinite loading if not authenticated
        return;
    }
    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);
    try {
      const query = new URLSearchParams();
      if (filters.name) query.append('name', filters.name);
      if (filters.positionId && filters.positionId !== "__ALL_POSITIONS__") query.append('positionId', filters.positionId);
      if (filters.education) query.append('education', filters.education);
      if (filters.minFitScore !== undefined) query.append('minFitScore', String(filters.minFitScore));
      if (filters.maxFitScore !== undefined) query.append('maxFitScore', String(filters.maxFitScore));

      const response = await fetch(`/api/candidates?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        const errorMessage = errorData.message || `Failed to fetch candidates: ${response.statusText || `Status: ${response.status}`}`;
        if (response.status === 401) {
            setAuthError(true);
            signIn(undefined, { callbackUrl: pathname });
            return;
        }
        setFetchError(errorMessage);
        setAllCandidates([]);
        return;
      }
      const data: Candidate[] = await response.json();
      setAllCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      const errorMessage = (error as Error).message || "Could not load candidate data.";
       if (!(errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden"))) {
        setFetchError(errorMessage);
      }
      setAllCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sessionStatus, pathname, signIn]);

  const refreshCandidateInList = useCallback(async (candidateId: string) => {
    const updatedCandidate = await fetchCandidateById(candidateId);
    if (updatedCandidate) {
      setAllCandidates(prev => prev.map(c => c.id === candidateId ? updatedCandidate : c));
    } else {
      toast({ title: "Refresh Error", description: `Could not refresh data for candidate ${candidateId}. Attempting full list refresh.`, variant: "destructive"});
       fetchCandidates();
    }
  }, [fetchCandidateById, toast, fetchCandidates]);


  const fetchPositions = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorText = errorData.message || `Status: ${response.status}`;
         if (response.status === 401) {
            setAuthError(true);
            signIn(undefined, { callbackUrl: pathname });
            return;
        }
        console.error("Error fetching positions for filter: ", errorText);
        setAvailablePositions([]);
        return;
      }
      const data: Position[] = await response.json();
      setAvailablePositions(data);
    } catch (error) {
      console.error("Error fetching positions for modal:", error);
      setAvailablePositions([]);
    }
  }, [sessionStatus, pathname, signIn]);

  const fetchRecruitmentStages = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    try {
      const response = await fetch('/api/settings/recruitment-stages');
      if (!response.ok) {
        if (response.status === 401) {
            setAuthError(true);
            signIn(undefined, { callbackUrl: pathname });
            return;
        }
        throw new Error('Failed to fetch recruitment stages');
      }
      const data: RecruitmentStage[] = await response.json();
      setAvailableStages(data);
    } catch (error) {
      console.error("Error fetching recruitment stages:", error);
      toast({ title: "Error", description: "Could not load recruitment stages for status selection.", variant: "destructive" });
      setAvailableStages([]); // Keep a default or empty list
    }
  }, [sessionStatus, pathname, signIn, toast]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      fetchCandidates();
      fetchPositions();
      fetchRecruitmentStages();
    }
  }, [filters, sessionStatus, fetchCandidates, fetchPositions, fetchRecruitmentStages, pathname, signIn]);


  const handleFilterChange = (newFilters: CandidateFilterValues) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters}));
  };


  const handleUpdateCandidateAPI = async (candidateId: string, status: CandidateStatus) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to update candidate: ${response.statusText || `Status: ${response.status}`}`);
      }
      const updatedCandidateFromServer: Candidate = await response.json();

      setAllCandidates(prev =>
        prev.map(c => (c.id === updatedCandidateFromServer.id ? updatedCandidateFromServer : c))
      );

      toast({
        title: "Candidate Updated",
        description: `${updatedCandidateFromServer.name}'s status set to ${updatedCandidateFromServer.status}.`,
      });
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast({
          title: "Error Updating Candidate",
          description: (error as Error).message || "Could not update candidate.",
          variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
     try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `Failed to delete candidate: ${response.statusText || `Status: ${response.status}`}`);
      }
      setAllCandidates(prev => prev.filter(c => c.id !== candidateId));
      toast({ title: "Candidate Deleted", description: `Candidate successfully deleted.` });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast({
          title: "Error Deleting Candidate",
          description: (error as Error).message || "Could not delete candidate.",
          variant: "destructive",
      });
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
      toast({
        title: "Candidate Added",
        description: `${newCandidate.name} has been successfully added.`,
      });
    } catch (error) {
      console.error("Error adding candidate:", error);
      toast({
          title: "Error Adding Candidate",
          description: (error as Error).message || "Could not add candidate.",
          variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenUploadModal = (candidate: Candidate) => {
    setSelectedCandidateForUpload(candidate);
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (updatedCandidate: Candidate) => {
    setAllCandidates(prev =>
      prev.map(c => (c.id === updatedCandidate.id ? updatedCandidate : c))
    );
    toast({ title: "Resume Uploaded", description: `Resume for ${updatedCandidate.name} successfully updated.`});
  };

  const handleN8nProcessingStart = () => {
    toast({
      title: "Processing Started",
      description: "Resume sent to n8n. Candidate list will refresh shortly if successful.",
    });
    setTimeout(() => {
        fetchCandidates();
    }, 15000);
  };

  const handleDownloadExcelTemplate = () => {
    const columns = [
      "name (Optional, or derive from personal_info.firstname/lastname)",
      "email (Optional, or derive from contact_info.email)",
      "phone (Optional)",
      "positionId (UUID, Optional)",
      "fitScore (Number 0-100, Optional, Default: 0)",
      "status (Default: Applied, e.g., Applied, Screening - use a valid stage name from Settings > Recruitment Stages)",
      "applicationDate (ISO8601 datetime string, Optional, Default: now)",
      "parsedData.cv_language (String, Optional)",
      "parsedData.personal_info.firstname (String, Required if name not provided)",
      "parsedData.personal_info.lastname (String, Required if name not provided)",
      "parsedData.personal_info.title_honorific (String, Optional)",
      "parsedData.personal_info.nickname (String, Optional)",
      "parsedData.personal_info.location (String, Optional)",
      "parsedData.personal_info.introduction_aboutme (String, Optional)",
      "parsedData.contact_info.email (String, Required if top-level email not provided)",
      "parsedData.contact_info.phone (String, Optional)",
      "parsedData.education (JSON string of array, Optional, e.g., '[{\"university\":\"U1\",\"major\":\"CS\"}]')",
      "parsedData.experience (JSON string of array, Optional, e.g., '[{\"company\":\"C1\",\"position\":\"Dev\"}]')",
      "parsedData.skills (JSON string of array, Optional, e.g., '[{\"segment_skill\":\"Lang\",\"skill\":[\"Java\",\"JS\"]}]')",
      "parsedData.job_suitable (JSON string of array, Optional)",
      "parsedData.job_matches (JSON string of array, Optional)",
    ];
    toast({
        title: "Excel Import Template Columns",
        description: (
            <div className="max-h-60 overflow-y-auto">
              <p className="mb-2">Your Excel file should have a header row with the following columns (or a subset). See API documentation for detailed structure of JSON fields.</p>
              <ul className="list-disc list-inside text-xs">
                {columns.map(col => <li key={col}>{col}</li>)}
              </ul>
            </div>
        ),
        duration: 15000,
    });
  };

  const handleExportToExcel = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.name) query.append('name', filters.name);
      if (filters.positionId && filters.positionId !== "__ALL_POSITIONS__") query.append('positionId', filters.positionId);

      const response = await fetch(`/api/candidates/export?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error exporting data." }));
        throw new Error(errorData.message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'candidates_export.csv';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export Successful", description: "Candidates exported to Excel (CSV format for this prototype)." });

    } catch (error) {
      console.error("Error exporting candidates:", error);
      toast({ title: "Export Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  const handleOpenEditPositionModal = (position: Position) => {
    setSelectedPositionForEdit(position);
    setIsEditPositionModalOpen(true);
  };

  const handlePositionEdited = async () => {
    toast({ title: "Position Updated", description: "Position details have been saved." });
    setIsEditPositionModalOpen(false);
    await fetchPositions();
    await fetchCandidates();
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && !pathname.startsWith('/auth/signin')) || (isLoading && !fetchError && allCandidates.length === 0)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (authError) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
            <ServerCrash className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4 max-w-md">You need to be signed in to view this page.</p>
            <Button onClick={() => signIn(undefined, { callbackUrl: pathname })} className="btn-hover-primary-gradient">Sign In</Button>
        </div>
    );
  }

  if (fetchError) {
    const isMissingTableError = fetchError.toLowerCase().includes("relation") && fetchError.toLowerCase().includes("does not exist");
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Candidates</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isMissingTableError && (
            <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-md text-sm">
                <p className="font-semibold">It looks like one or more necessary database tables (e.g., "Candidate", "Position") are missing.</p>
                <p className="mt-1">This usually means the database initialization script (`pg-init-scripts/init-db.sql`) did not run correctly when the PostgreSQL Docker container started.</p>
                <p className="mt-2">Please refer to the troubleshooting steps in the `README.md` or check the PostgreSQL container logs for details.</p>
            </div>
        )}
        <Button onClick={fetchCandidates} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <h1 className="text-2xl font-semibold text-foreground hidden md:block">
          Candidate Management
        </h1>
        <div className="w-full flex flex-col sm:flex-row gap-2 items-center sm:justify-end">
          <Button onClick={() => setIsCreateViaN8nModalOpen(true)} className="w-full sm:w-auto btn-primary-gradient">
            <Zap className="mr-2 h-4 w-4" /> Create via Resume (n8n)
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                More Actions <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Candidate Manually
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                <FileUp className="mr-2 h-4 w-4" /> Import Candidates (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadExcelTemplate}>
                <FileDown className="mr-2 h-4 w-4" /> Download Excel Template Guide
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportToExcel} disabled={isLoading}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Candidates (Excel/CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CandidateFilters
        initialFilters={filters}
        onFilterChange={handleFilterChange}
        availablePositions={availablePositions}
        isLoading={isLoading && allCandidates.length > 0}
      />

      {isLoading && allCandidates.length === 0 && !fetchError ? (
         <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card shadow">
            <Users className="w-16 h-16 text-muted-foreground animate-pulse mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Loading Candidates...</h3>
            <p className="text-muted-foreground">Please wait while we fetch the data.</p>
        </div>
      ) : (
        <CandidateTable
          candidates={allCandidates}
          availablePositions={availablePositions}
          availableStages={availableStages}
          onUpdateCandidate={handleUpdateCandidateAPI}
          onDeleteCandidate={handleDeleteCandidate}
          onOpenUploadModal={handleOpenUploadModal}
          onEditPosition={handleOpenEditPositionModal}
          isLoading={isLoading && allCandidates.length > 0 && !fetchError}
          onRefreshCandidateData={refreshCandidateInList}
        />
      )}

      <AddCandidateModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddCandidate={handleAddCandidateSubmit}
        availablePositions={availablePositions}
        availableStages={availableStages}
      />

      <UploadResumeModal
        isOpen={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        candidate={selectedCandidateForUpload}
        onUploadSuccess={handleUploadSuccess}
      />
      <CreateCandidateViaN8nModal
        isOpen={isCreateViaN8nModalOpen}
        onOpenChange={setIsCreateViaN8nModalOpen}
        onProcessingStart={handleN8nProcessingStart}
      />
      <ImportCandidatesModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportSuccess={fetchCandidates}
      />
      {selectedPositionForEdit && (
        <EditPositionModal
          isOpen={isEditPositionModalOpen}
          onOpenChange={(isOpen) => {
            setIsEditPositionModalOpen(isOpen);
            if (!isOpen) setSelectedPositionForEdit(null);
          }}
          position={selectedPositionForEdit}
          onEditPosition={handlePositionEdited}
        />
      )}
    </div>
  );
}
