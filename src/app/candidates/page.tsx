
"use client"; 

import { useState, useEffect, useCallback } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import type { Candidate, CandidateStatus, TransitionRecord, Position } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AddCandidateModal, type AddCandidateFormValues } from '@/components/candidates/AddCandidateModal'; // Import the modal

export default function CandidatesPage() {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [filters, setFilters] = useState<CandidateFilterValues>({ minFitScore: 0, maxFitScore: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const { toast } = useToast();

  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }
      const data: Position[] = await response.json();
      setAvailablePositions(data.filter(p => p.isOpen)); // Only show open positions
    } catch (error) {
      console.error("Error fetching positions for modal:", error);
      toast({
        title: "Error Fetching Positions",
        description: (error as Error).message || "Could not load position data for form.",
        variant: "destructive",
      });
    }
  }, [toast]);


  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/candidates');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to fetch candidates: ${response.status}`);
      }
      const data: Candidate[] = await response.json();
      setAllCandidates(data);
      setFilteredCandidates(data); 
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({
        title: "Error Fetching Candidates",
        description: (error as Error).message || "Could not load candidate data.",
        variant: "destructive",
      });
      setAllCandidates([]); 
      setFilteredCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCandidates();
    fetchPositions(); // Fetch positions when component mounts
  }, [fetchCandidates, fetchPositions]);

  const applyFilters = useCallback((currentCandidates: Candidate[], currentFilters: CandidateFilterValues) => {
    return currentCandidates.filter(candidate => {
      if (currentFilters.name && !candidate.name.toLowerCase().includes(currentFilters.name.toLowerCase())) {
        return false;
      }
      if (currentFilters.positionId && candidate.positionId !== currentFilters.positionId) {
        return false;
      }
      const educationQuery = currentFilters.education?.toLowerCase();
      // Check against the new CandidateDetails structure for education
      if (educationQuery && 
          !((candidate.parsedData as any)?.education?.some((edu: any) => 
              Object.values(edu).some(val => String(val).toLowerCase().includes(educationQuery))
          ) || (candidate.parsedData as any)?.skills?.some((skill: any) => // also check skills if parsedData is old structure
             String(skill).toLowerCase().includes(educationQuery)
          ))
         ) {
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
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update candidate: ${response.statusText}`);
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
      throw error; 
    }
  };

  const handleAddCandidateSubmit = async (formData: AddCandidateFormValues) => {
    try {
      // Prepare data for the API
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
          skills: formData.skills,
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
        throw new Error(errorData.message || `Failed to add candidate: ${response.statusText}`);
      }
      const newCandidate: Candidate = await response.json();
      setAllCandidates(prev => [newCandidate, ...prev]); // Add to top of list
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
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div></div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
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

      <AddCandidateModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddCandidate={handleAddCandidateSubmit}
        availablePositions={availablePositions}
      />
    </div>
  );
}
