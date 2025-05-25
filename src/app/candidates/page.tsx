
"use client"; 

import { useState, useEffect, useCallback } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import type { Candidate, CandidateStatus, TransitionRecord, Position, CandidateDetails, OldParsedResumeData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AddCandidateModal, type AddCandidateFormValues } from '@/components/candidates/AddCandidateModal';
import { UploadResumeModal } from '@/components/candidates/UploadResumeModal'; 
import { signIn, useSession } from 'next-auth/react';

export default function CandidatesPage() {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [filters, setFilters] = useState<CandidateFilterValues>({ minFitScore: 0, maxFitScore: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); 
  const [selectedCandidateForUpload, setSelectedCandidateForUpload] = useState<Candidate | null>(null); 
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const [authError, setAuthError] = useState(false);

  const fetchPositions = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
      // Don't fetch if not authenticated, rely on main fetch logic to handle authError
      return;
    }
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) {
        const errorText = response.statusText || `Status: ${response.status}`;
        if (response.status === 401) {
            setAuthError(true);
            // No need to throw here, authError state will handle UI
            return; 
        }
        throw new Error(`Failed to fetch positions: ${errorText}`);
      }
      const data: Position[] = await response.json();
      setAvailablePositions(data.filter(p => p.isOpen)); 
    } catch (error) {
      console.error("Error fetching positions:", error);
      if (!(error as Error).message.includes("401")) { // Don't toast for auth errors handled by UI
        toast({
            title: "Error Fetching Positions",
            description: (error as Error).message || "Could not load position data.",
            variant: "destructive",
        });
      }
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
    try {
      const response = await fetch('/api/candidates');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        if (response.status === 401) {
            setAuthError(true);
            setIsLoading(false);
            return;
        }
        throw new Error(errorData.message || `Failed to fetch candidates: ${response.statusText || `Status: ${response.status}`}`);
      }
      const data: Candidate[] = await response.json();
      setAllCandidates(data);
      setFilteredCandidates(data); 
    } catch (error) {
      console.error("Error fetching candidates:", error);
       if (!(error as Error).message.includes("401")) {
        toast({
            title: "Error Fetching Candidates",
            description: (error as Error).message || "Could not load candidate data.",
            variant: "destructive",
        });
      }
      setAllCandidates([]); 
      setFilteredCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchCandidates();
      fetchPositions();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
      setAuthError(true);
    }
    // If sessionStatus is 'loading', we wait.
  }, [sessionStatus, fetchCandidates, fetchPositions]);


  const applyFilters = useCallback((currentCandidates: Candidate[], currentFilters: CandidateFilterValues) => {
    return currentCandidates.filter(candidate => {
      if (currentFilters.name && !candidate.name.toLowerCase().includes(currentFilters.name.toLowerCase())) {
        return false;
      }
      if (currentFilters.positionId && candidate.positionId !== currentFilters.positionId) {
        return false;
      }
      const educationQuery = currentFilters.education?.toLowerCase();
      if (educationQuery) {
        const pd = candidate.parsedData as CandidateDetails | OldParsedResumeData | null;
        let foundInEducation = false;
        if (pd && 'personal_info' in pd && pd.education) { 
            foundInEducation = pd.education.some(edu => 
                Object.values(edu).some(val => String(val).toLowerCase().includes(educationQuery))
            );
        } else if (pd && 'skills' in pd && Array.isArray((pd as OldParsedResumeData).education)) { 
            foundInEducation = (pd as OldParsedResumeData).education.some(eduStr => eduStr.toLowerCase().includes(educationQuery));
        }
        if (!foundInEducation) return false;
      }
      if (currentFilters.minFitScore !== undefined && candidate.fitScore < currentFilters.minFitScore) {
        return false;
      }
      if (currentFilters.maxFitScore !== undefined && candidate.fitScore > currentFilters.maxFitScore) {
        return false;
      }
      return true;
    });
  }, []);

  useEffect(() => {
    setFilteredCandidates(applyFilters(allCandidates, filters));
  }, [filters, allCandidates, applyFilters]);

  const handleFilterChange = (newFilters: CandidateFilterValues) => {
    setFilters(newFilters);
  };

  const handleUpdateCandidateAPI = async (candidateId: string, status: CandidateStatus) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
            setAuthError(true);
            toast({ title: "Authentication Error", description: "Your session may have expired. Please sign in again.", variant: "destructive" });
            return; // Do not throw, let authError handle UI
        }
        throw new Error(errorData.message || `Failed to update candidate: ${response.statusText || `Status: ${response.status}`}`);
      }
      const updatedCandidateFromServer: Candidate = await response.json();
      
      setAllCandidates(prev => 
        prev.map(c => (c.id === updatedCandidateFromServer.id ? updatedCandidateFromServer : c))
      );
      setFilteredCandidates(prev => 
        prev.map(c => (c.id === updatedCandidateFromServer.id ? updatedCandidateFromServer : c))
      );

      toast({
        title: "Candidate Updated",
        description: `${updatedCandidateFromServer.name}'s status set to ${updatedCandidateFromServer.status}.`,
      });
    } catch (error) {
      console.error("Error updating candidate:", error);
      if (!(error as Error).message.includes("401")) {
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
        const errorData = await response.json();
         if (response.status === 401) {
            setAuthError(true);
            toast({ title: "Authentication Error", description: "Your session may have expired. Please sign in again.", variant: "destructive" });
            return;
        }
        throw new Error(errorData.message || `Failed to delete candidate: ${response.statusText || `Status: ${response.status}`}`);
      }
      setAllCandidates(prev => prev.filter(c => c.id !== candidateId));
      setFilteredCandidates(prev => prev.filter(c => c.id !== candidateId));
      toast({ title: "Candidate Deleted", description: `Candidate successfully deleted.` });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      if (!(error as Error).message.includes("401")) {
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
        const errorData = await response.json();
        if (response.status === 401) {
            setAuthError(true);
            toast({ title: "Authentication Error", description: "Your session may have expired. Please sign in again.", variant: "destructive" });
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
      if (!(error as Error).message.includes("401")) {
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
     setFilteredCandidates(prev => 
      prev.map(c => (c.id === updatedCandidate.id ? updatedCandidate : c))
    );
  };

  if (sessionStatus === 'loading' || (isLoading && !authError)) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-full"></div> {/* Filter placeholder */}
        <div className="h-64 bg-muted rounded w-full"></div> {/* Table placeholder */}
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
        <Button onClick={() => signIn('azure-ad')}>Sign In</Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <h1 className="text-2xl font-semibold text-foreground hidden md:block">
          Candidate Management
        </h1>
        <div className="w-full md:w-auto flex justify-end">
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Candidate
          </Button>
        </div>
      </div>

      <CandidateFilters initialFilters={filters} onFilterChange={handleFilterChange} availablePositions={availablePositions} />
      
      {isLoading && allCandidates.length === 0 ? ( // This specific loader is for when initial fetch is happening and there are no candidates yet
         <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card shadow">
            <Users className="w-16 h-16 text-muted-foreground animate-pulse mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Loading Candidates...</h3>
            <p className="text-muted-foreground">Please wait while we fetch the data.</p>
        </div>
      ) : (
        <CandidateTable 
          candidates={filteredCandidates} 
          onUpdateCandidate={handleUpdateCandidateAPI} 
          onDeleteCandidate={handleDeleteCandidate} 
          onOpenUploadModal={handleOpenUploadModal} 
          isLoading={isLoading && allCandidates.length > 0} 
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
    </div>
  );
}
