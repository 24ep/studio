
"use client"; // This page manages state for filters and candidate list

import { useState, useEffect, useCallback } from 'react';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { mockCandidates } from '@/lib/data';
import type { Candidate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react'; // Assuming an Add Candidate button

export default function CandidatesPage() {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>(mockCandidates);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(mockCandidates);
  const [filters, setFilters] = useState<CandidateFilterValues>({ minFitScore: 0, maxFitScore: 100 });

  const applyFilters = useCallback((currentCandidates: Candidate[], currentFilters: CandidateFilterValues) => {
    return currentCandidates.filter(candidate => {
      if (currentFilters.name && !candidate.name.toLowerCase().includes(currentFilters.name.toLowerCase())) {
        return false;
      }
      if (currentFilters.positionId && candidate.positionId !== currentFilters.positionId) {
        return false;
      }
      if (currentFilters.education && !candidate.parsedData.education.some(edu => edu.toLowerCase().includes(currentFilters.education!.toLowerCase()))) {
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

  const handleUpdateCandidate = (updatedCandidate: Candidate) => {
    setAllCandidates(prev => 
      prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c)
    );
  };
  
  const handleDeleteCandidate = (candidateId: string) => {
     setAllCandidates(prev => prev.filter(c => c.id !== candidateId));
  };

  // Placeholder for adding a new candidate
  const handleAddCandidate = () => {
    console.log("Add new candidate action triggered");
    // This would typically open a modal or navigate to a form
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        {/* This h1 would typically be in the Header component, passed as pageTitle */}
        {/* <h1 className="text-2xl font-semibold text-foreground">Candidate Management</h1> */}
        <div>{/* Placeholder for breadcrumbs or other actions */}</div>
        <Button onClick={handleAddCandidate} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Candidate
        </Button>
      </div>

      <CandidateFilters initialFilters={filters} onFilterChange={handleFilterChange} />
      
      <CandidateTable 
        candidates={filteredCandidates} 
        onUpdateCandidate={handleUpdateCandidate}
        onDeleteCandidate={handleDeleteCandidate} 
      />
    </div>
  );
}
