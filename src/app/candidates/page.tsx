
"use client"; 

import { useState, useEffect, useCallback } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import type { Candidate, CandidateStatus, TransitionRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function CandidatesPage() {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [filters, setFilters] = useState<CandidateFilterValues>({ minFitScore: 0, maxFitScore: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/candidates');
      if (!response.ok) {
        throw new Error(`Failed to fetch candidates: ${response.statusText}`);
      }
      const data: Candidate[] = await response.json();
      setAllCandidates(data);
      setFilteredCandidates(data); // Initially show all
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({
        title: "Error Fetching Candidates",
        description: (error as Error).message || "Could not load candidate data.",
        variant: "destructive",
      });
      setAllCandidates([]); // Set to empty on error to avoid issues with undefined data
      setFilteredCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const applyFilters = useCallback((currentCandidates: Candidate[], currentFilters: CandidateFilterValues) => {
    return currentCandidates.filter(candidate => {
      if (currentFilters.name && !candidate.name.toLowerCase().includes(currentFilters.name.toLowerCase())) {
        return false;
      }
      if (currentFilters.positionId && candidate.positionId !== currentFilters.positionId) {
        return false;
      }
      // Ensure parsedData and education exist before trying to access them
      const educationQuery = currentFilters.education?.toLowerCase();
      if (educationQuery && !(candidate.parsedData as any)?.education?.some((edu: string) => edu.toLowerCase().includes(educationQuery))) {
        return false;
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

  const handleUpdateCandidate = async (candidateId: string, status: CandidateStatus, newTransitionHistory: TransitionRecord[]) => {
    // This function is primarily called from CandidateTable -> ManageTransitionsModal
    // The modal itself now prepares the new transition and new status
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }), // Only send status, API handles transition history creation
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update candidate: ${response.statusText}`);
      }
      const updatedCandidateFromServer: Candidate = await response.json();
      
      // Update local state
      setAllCandidates(prev => 
        prev.map(c => (c.id === updatedCandidateFromServer.id ? updatedCandidateFromServer : c))
      );
      // Re-apply filters in case the update affects filtering (though status change might not directly)
      setFilteredCandidates(applyFilters(allCandidates.map(c => (c.id === updatedCandidateFromServer.id ? updatedCandidateFromServer : c)), filters));

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
      throw error; // Re-throw to let modal know update failed
    }
  };
  
  const handleDeleteCandidate = async (candidateId: string) => {
     try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete candidate: ${response.statusText}`);
      }
      setAllCandidates(prev => prev.filter(c => c.id !== candidateId));
      // Toast is handled by CandidateTable for successful deletion
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast({
        title: "Error Deleting Candidate",
        description: (error as Error).message || "Could not delete candidate.",
        variant: "destructive",
      });
      // Re-throw if needed or handle more gracefully in CandidateTable
      throw error; 
    }
  };

  const handleAddCandidate = () => {
    console.log("Add new candidate action triggered");
    toast({ title: "Add Candidate", description: "Functionality to add a new candidate is not yet implemented.", variant: "default" });
    // This would typically open a modal or navigate to a form
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div></div>
        <Button onClick={handleAddCandidate} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Candidate
        </Button>
      </div>

      <CandidateFilters initialFilters={filters} onFilterChange={handleFilterChange} />
      
      <CandidateTable 
        candidates={filteredCandidates} 
        onUpdateCandidate={handleUpdateCandidate}
        onDeleteCandidate={handleDeleteCandidate} 
        isLoading={isLoading}
      />
    </div>
  );
}
