
"use client"; 

import { useState, useEffect, useCallback } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import type { Candidate, CandidateStatus, TransitionRecord, Position, CandidateDetails, OldParsedResumeData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, AlertTriangle, ServerCrash, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AddCandidateModal, type AddCandidateFormValues } from '@/components/candidates/AddCandidateModal';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal'; 
import { CreateCandidateViaN8nModal } from '@/components/candidates/CreateCandidateViaN8nModal';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';


export default function CandidatesPage() {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [filters, setFilters] = useState<CandidateFilterValues>({ minFitScore: 0, maxFitScore: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); 
  const [isCreateViaN8nModalOpen, setIsCreateViaN8nModalOpen] = useState(false);
  const [selectedCandidateForUpload, setSelectedCandidateForUpload] = useState<Candidate | null>(null); 
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const [authError, setAuthError] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCandidateById = useCallback(async (candidateId: string): Promise<Candidate | null> => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) {
        // Handle errors appropriately, maybe log or show a specific toast
        console.error(`Failed to fetch candidate ${candidateId}: ${response.statusText}`);
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
      // If fetching fails, maybe just refetch all or show an error
      toast({ title: "Refresh Error", description: `Could not refresh data for candidate ${candidateId}.`, variant: "destructive"});
    }
  }, [fetchCandidateById, toast]);


  const fetchPositions = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
      return;
    }
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        const errorMessage = errorData.message || `Failed to fetch positions: ${response.statusText || `Status: ${response.status}`}`;
        if (response.status === 401) {
            setAuthError(true);
            return; 
        }
        toast({
            title: "Error Fetching Positions",
            description: errorMessage,
            variant: "destructive",
        });
        setAvailablePositions([]); 
        return;
      }
      const data: Position[] = await response.json();
      setAvailablePositions(data.filter(p => p.isOpen)); 
    } catch (error) {
      console.error("Error fetching positions for modal:", error);
      if (!String((error as Error).message).includes("401")) { 
        toast({
            title: "Error Fetching Positions",
            description: (error as Error).message || "Could not load position data.",
            variant: "destructive",
        });
      }
       setAvailablePositions([]); 
    }
  }, [toast, sessionStatus]);

  const fetchCandidates = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
      setIsLoading(false);
      setAuthError(true);
      return;
    }
    setIsLoading(true);
    setAuthError(false);
    setFetchError(null);
    try {
      // Construct query parameters for filtering
      const query = new URLSearchParams();
      if (filters.name) query.append('name', filters.name);
      if (filters.positionId) query.append('positionId', filters.positionId);
      if (filters.education) query.append('education', filters.education);
      if (filters.minFitScore !== undefined) query.append('minFitScore', String(filters.minFitScore));
      if (filters.maxFitScore !== undefined) query.append('maxFitScore', String(filters.maxFitScore));
      
      const response = await fetch(`/api/candidates?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        const errorMessage = errorData.message || `Failed to fetch candidates: ${response.statusText || `Status: ${response.status}`}`;
        if (response.status === 401) {
            setAuthError(true);
            setIsLoading(false);
            return;
        }
        setFetchError(errorMessage);
        setAllCandidates([]); 
        setFilteredCandidates([]); // Ensure this is also cleared
        return;
      }
      const data: Candidate[] = await response.json();
      setAllCandidates(data);
      // No need to call applyFilters here, as the useEffect for [filters, allCandidates] will handle it.
      // However, since we are fetching based on filters, the result *is* the filtered list.
      // For simplicity here, we'll just set allCandidates and let the effect run.
      // A more optimized approach might directly setFilteredCandidates if API does the filtering.
    } catch (error) {
      console.error("Error fetching candidates:", error);
      const errorMessage = (error as Error).message || "Could not load candidate data.";
      if (!fetchError && !errorMessage.includes("401")) { // Avoid overwriting existing fetchError unless new
        setFetchError(errorMessage);
      }
      setAllCandidates([]); 
      setFilteredCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, filters, fetchError]); // Added filters to dependency array for API-side filtering

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchCandidates(); // Will now fetch based on current `filters` state
      fetchPositions();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
      setAuthError(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [sessionStatus, filters]); // fetchCandidates and fetchPositions are stable due to useCallback

  const handleFilterChange = (newFilters: CandidateFilterValues) => {
    setFilters(newFilters); // This will trigger the useEffect above to re-fetch candidates with new filters
  };


  const handleUpdateCandidateAPI = async (candidateId: string, status: CandidateStatus, newTransitionHistory?: TransitionRecord[]) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }), 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        if (response.status === 401 || response.status === 403) {
            setAuthError(true);
            toast({ title: "Authorization Error", description: errorData.message || "Your session may have expired or you lack permission.", variant: "destructive" });
            return; 
        }
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
      if (!String((error as Error).message).includes("401") && !String((error as Error).message).includes("403")){
        toast({
            title: "Error Updating Candidate",
            description: (error as Error).message || "Could not update candidate.",
            variant: "destructive",
        });
      }
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
         if (response.status === 401 || response.status === 403) {
            setAuthError(true);
            toast({ title: "Authorization Error", description: errorData.message || "Your session may have expired or you lack permission.", variant: "destructive" });
            return;
        }
        throw new Error(errorData.message || `Failed to delete candidate: ${response.statusText || `Status: ${response.status}`}`);
      }
      setAllCandidates(prev => prev.filter(c => c.id !== candidateId));
      toast({ title: "Candidate Deleted", description: `Candidate successfully deleted.` });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      if (!String((error as Error).message).includes("401") && !String((error as Error).message).includes("403")){
        toast({
            title: "Error Deleting Candidate",
            description: (error as Error).message || "Could not delete candidate.",
            variant: "destructive",
        });
      }
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
          experience: formData.experience,
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
        if (response.status === 401 || response.status === 403) {
            setAuthError(true);
            toast({ title: "Authorization Error", description: errorData.message || "Your session may have expired or you lack permission.", variant: "destructive" });
            setIsLoading(false);
            return;
        }
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
      if (!String((error as Error).message).includes("401") && !String((error as Error).message).includes("403")){
        toast({
            title: "Error Adding Candidate",
            description: (error as Error).message || "Could not add candidate.",
            variant: "destructive",
        });
      }
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
  };
  
  const handleN8nProcessingStart = () => {
    setTimeout(() => {
        fetchCandidates(); 
    }, 15000); 
  };


  if (sessionStatus === 'loading' || (isLoading && !authError && !fetchError)) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-full"></div>
        <div className="h-64 bg-muted rounded w-full"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You need to be signed in to view or manage candidates.
        </p>
        <Button onClick={() => signIn()}>Sign In</Button>
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
                <p className="font-semibold">It looks like the necessary database tables (e.g., "Candidate", "Position") are missing.</p>
                <p className="mt-1">This usually means the database initialization script (`pg-init-scripts/init-db.sql`) did not run correctly when the PostgreSQL Docker container started.</p>
                <p className="mt-2">Please refer to the troubleshooting steps in the `README.md` or go to the <Link href="/setup" className="text-primary hover:underline font-medium">Application Setup</Link> page to verify the schema and find guidance.</p>
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
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setIsCreateViaN8nModalOpen(true)} variant="outline" className="w-full sm:w-auto btn-hover-primary-gradient">
            <Zap className="mr-2 h-4 w-4" /> Create via Resume (n8n)
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Candidate Manually
          </Button>
        </div>
      </div>

      <CandidateFilters initialFilters={filters} onFilterChange={handleFilterChange} availablePositions={availablePositions} />
      
      {isLoading && allCandidates.length === 0 && !fetchError ? ( 
         <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card shadow">
            <Users className="w-16 h-16 text-muted-foreground animate-pulse mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Loading Candidates...</h3>
            <p className="text-muted-foreground">Please wait while we fetch the data.</p>
        </div>
      ) : (
        <CandidateTable 
          candidates={allCandidates} // Pass allCandidates, filtering is done API side or via useEffect if needed
          onUpdateCandidate={handleUpdateCandidateAPI} 
          onDeleteCandidate={handleDeleteCandidate} 
          onOpenUploadModal={handleOpenUploadModal} 
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
    </div>
  );
}
