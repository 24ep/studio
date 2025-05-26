
"use client";

import { useState, useEffect, useCallback } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import type { Candidate, CandidateStatus, Position } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, Users, ServerCrash, Zap, Loader2, FileDown, FileUp, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AddCandidateModal, type AddCandidateFormValues } from '@/components/candidates/AddCandidateModal';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal';
import { CreateCandidateViaN8nModal } from '@/components/candidates/CreateCandidateViaN8nModal';
import { ImportCandidatesModal } from '@/components/candidates/ImportCandidatesModal';
import { EditPositionModal, type EditPositionFormValues } from '@/components/positions/EditPositionModal'; // Import EditPositionModal
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';


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
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);


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
      toast({ title: "Refresh Error", description: `Could not refresh data for candidate ${candidateId}.`, variant: "destructive"});
       fetchCandidates(); 
    }
  }, [fetchCandidateById, toast]); 


  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        const errorMessage = errorData.message || `Failed to fetch positions: ${response.statusText || `Status: ${response.status}`}`;
        console.error("Error fetching positions for filter: ", errorMessage);
        setAvailablePositions([]);
        return;
      }
      const data: Position[] = await response.json();
      setAvailablePositions(data); 
    } catch (error) {
      console.error("Error fetching positions for modal:", error);
      setAvailablePositions([]);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
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
        
        if (errorMessage.toLowerCase().includes("relation") && errorMessage.toLowerCase().includes("does not exist")) {
           setFetchError(`Database table 'Candidate' or a related table might be missing. Please refer to README.md or /setup for troubleshooting. Error: ${errorMessage}`);
        } else {
            setFetchError(errorMessage);
        }
        setAllCandidates([]);
        return;
      }
      const data: Candidate[] = await response.json();
      setAllCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      const errorMessage = (error as Error).message || "Could not load candidate data.";
      if (errorMessage.toLowerCase().includes("relation") && errorMessage.toLowerCase().includes("does not exist")) {
         setFetchError(`Database table 'Candidate' or a related table might be missing. Please check the database schema setup. Refer to README.md for troubleshooting. Error: ${errorMessage}`);
      } else {
         setFetchError(errorMessage);
      }
      setAllCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCandidates();
    fetchPositions();
  }, [filters, fetchCandidates, fetchPositions]);


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

  const handleDownloadTemplate = (type: 'json' | 'excel') => {
    if (type === 'json') {
      const candidateTemplate = [{
        "name": "John Doe (Optional, or derive from personal_info)",
        "email": "john.doe@example.com (Optional, or derive from contact_info)",
        "phone": "123-456-7890 (Optional)",
        "positionId": "valid-position-uuid-if-known (Optional)",
        "fitScore": 0,
        "status": "Applied",
        "parsedData": {
          "cv_language": "English",
          "personal_info": {"firstname": "John", "lastname": "Doe", "location": "City, Country"},
          "contact_info": {"email": "john.doe@example.com", "phone": "123-456-7890"},
          "education": [{"university": "State University", "major": "Computer Science", "period": "2018-2022"}],
          "experience": [{"company": "Tech Corp", "position": "Intern", "period": "Jun 2021 - Aug 2021", "description": "Worked on...", "postition_level": "entry level"}],
          "skills": [{"segment_skill": "Programming", "skill": ["JavaScript", "Python"]}],
          "job_suitable": [{"suitable_career": "Software Development", "suitable_job_position": "Junior Developer"}]
        }
      }];
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(candidateTemplate, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "candidate_import_template.json";
      link.click();
      toast({ title: "Template Downloaded", description: "Candidate JSON import template has been downloaded." });
    } else {
        toast({ title: "Excel Template", description: "Excel template download not yet implemented.", variant: "default"});
    }
  };

  const handleOpenEditPositionModal = (position: Position) => {
    setSelectedPositionForEdit(position);
    setIsEditPositionModalOpen(true);
  };

  const handlePositionEdited = async () => {
    toast({ title: "Position Updated", description: "Position details have been saved." });
    setIsEditPositionModalOpen(false);
    await fetchPositions(); // Refresh available positions for filters
    await fetchCandidates(); // Refresh candidates as their position details might have changed
  };


  if (isLoading && allCandidates.length === 0 && !fetchError ) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
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
                <FileUp className="mr-2 h-4 w-4" /> Import Candidates (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadTemplate('excel')}>
                <FileDown className="mr-2 h-4 w-4" /> Download Template (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadTemplate('json')}>
                <FileDown className="mr-2 h-4 w-4" /> Download Template (JSON)
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
