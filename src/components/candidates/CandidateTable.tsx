"use client";

import * as React from "react";
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileEdit, Trash2, Eye, Users, UploadCloud, Briefcase } from 'lucide-react';
import type { Candidate, CandidateStatus, Position, RecruitmentStage } from '@/lib/types';
import { ManageTransitionsModal } from './ManageTransitionsModal';
import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CandidateTableProps {
  candidates: Candidate[];
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiters: { id: string; name: string }[];
  onAssignRecruiter: (candidateId: string, recruiterId: string | null) => void;
  onUpdateCandidate: (candidateId: string, status: CandidateStatus) => Promise<void>;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  onOpenUploadModal: (candidate: Candidate) => void;
  onEditPosition: (position: Position) => void;
  isLoading?: boolean;
  onRefreshCandidateData: (candidateId: string) => Promise<void>;
  // For bulk actions
  selectedCandidateIds: Set<string>;
  onToggleSelectCandidate: (candidateId: string) => void;
  onToggleSelectAllCandidates: () => void;
  isAllCandidatesSelected: boolean;
}

const getStatusBadgeVariant = (status: CandidateStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Hired':
    case 'Offer Accepted':
      return 'default';
    case 'Interview Scheduled':
    case 'Interviewing':
    case 'Offer Extended':
      return 'secondary';
    case 'Rejected':
      return 'destructive';
    case 'Applied':
    case 'Screening':
    case 'Shortlisted':
    case 'On Hold':
      return 'outline';
    default:
      return 'outline';
  }
};

export function CandidateTable({
  candidates,
  availablePositions,
  availableStages,
  availableRecruiters,
  onAssignRecruiter,
  onUpdateCandidate,
  onDeleteCandidate,
  onOpenUploadModal,
  onEditPosition,
  isLoading,
  onRefreshCandidateData,
  selectedCandidateIds,
  onToggleSelectCandidate,
  onToggleSelectAllCandidates,
  isAllCandidatesSelected,
}: CandidateTableProps) {
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<Candidate | null>(null);
  const [isTransitionsModalOpen, setIsTransitionsModalOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);


  const handleManageTransitionsClick = (candidate: Candidate) => {
    setSelectedCandidateForModal(candidate);
    setIsTransitionsModalOpen(true);
  };

  const handleEditPositionClick = (positionId: string | null | undefined) => {
    if (!positionId) return;
    const positionToEdit = availablePositions.find(p => p.id === positionId);
    if (positionToEdit) {
      onEditPosition(positionToEdit);
    }
  };

  const confirmDelete = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
  };

  const executeDelete = () => {
    if (candidateToDelete) {
      onDeleteCandidate(candidateToDelete.id);
      setCandidateToDelete(null);
    }
  };


  if (isLoading) {
     return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card shadow">
        <Users className="w-16 h-16 text-muted-foreground animate-pulse mb-4" />
        <h3 className="text-xl font-semibold text-foreground">Loading Candidates...</h3>
        <p className="text-muted-foreground">Please wait while we fetch the data.</p>
      </div>
    );
  }


  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card shadow">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground">No Candidates Found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or add new candidates.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead className="w-12"><Checkbox
                checked={isAllCandidatesSelected}
                onCheckedChange={onToggleSelectAllCandidates}
                aria-label="Select all candidates"
              /></TableHead><TableHead className="w-[250px]">Candidate</TableHead><TableHead>Applied Job</TableHead><TableHead>Recruiter</TableHead><TableHead className="w-[100px] hidden sm:table-cell">Fit Score</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Last Update</TableHead><TableHead className="w-[120px] hidden sm:table-cell">Resume</TableHead><TableHead className="text-right w-[80px]">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {candidates.map((candidate) => {
              const dateValue = candidate.updatedAt || candidate.createdAt;
              let displayDate = 'N/A';
              if (dateValue && typeof dateValue === 'string') {
                try {
                  displayDate = format(parseISO(dateValue), "MMM d, yyyy");
                } catch (e) {
                  console.error("Failed to parse date for candidate " + candidate.id + ": " + dateValue, e);
                  displayDate = 'Invalid Date';
                }
              } else if (dateValue) {
                try {
                  displayDate = format(new Date(dateValue as any), "MMM d, yyyy");
                } catch (e) {
                   console.error("Failed to format non-string date for candidate " + candidate.id + ": " + dateValue, e);
                   displayDate = 'Invalid Date';
                }
              }

              return (
                <TableRow key={candidate.id} className="hover:bg-muted/50 transition-colors" data-state={selectedCandidateIds.has(candidate.id) ? 'selected' : ''}>
                  <TableCell><Checkbox
                      checked={selectedCandidateIds.has(candidate.id)}
                      onCheckedChange={() => onToggleSelectCandidate(candidate.id)}
                      aria-label={`Select candidate ${candidate.name}`}
                    /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={(candidate.parsedData as any)?.personal_info?.avatar_url || `https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/candidates/${candidate.id}`} passHref>
                          <span className="font-medium text-foreground hover:underline cursor-pointer">{candidate.name}</span>
                        </Link>
                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {candidate.position?.title ? (
                      <span
                        className="font-medium text-primary hover:underline cursor-pointer"
                        onClick={() => handleEditPositionClick(candidate.positionId)}
                        title={`Edit ${candidate.position.title}`}
                      >
                        {candidate.position.title}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select value={candidate.recruiter?.id || ''} onValueChange={value => onAssignRecruiter(candidate.id, value === '___UNASSIGN___' ? null : value)}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="___UNASSIGN___">Unassigned</SelectItem>
                        {availableRecruiters.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Progress value={candidate.fitScore || 0} className="h-2 w-[60px]" />
                      <span className="text-sm font-medium text-foreground">{(candidate.fitScore || 0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(candidate.status)} className="capitalize">
                      {candidate.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {displayDate}
                  </TableCell>
                  <TableCell className="text-xs hidden sm:table-cell">
                    {candidate.resumePath ?
                      <span className="text-green-600 truncate block max-w-[100px] hover:underline cursor-pointer" title={candidate.resumePath}>
                        {candidate.resumePath.split('-').pop()?.split('.').slice(0,-1).join('.') || candidate.resumePath.split('-').pop()}
                      </span>
                      : <span className="text-muted-foreground">No resume</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/candidates/${candidate.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleManageTransitionsClick(candidate)}>
                          <FileEdit className="mr-2 h-4 w-4" /> Manage Transitions
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => onOpenUploadModal(candidate)}>
                          <UploadCloud className="mr-2 h-4 w-4" /> Upload Resume
                        </DropdownMenuItem>
                        {candidate.positionId && (
                          <DropdownMenuItem onSelect={() => handleEditPositionClick(candidate.positionId)}>
                            <Briefcase className="mr-2 h-4 w-4" /> Edit Applied Job
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => confirmDelete(candidate)} className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {selectedCandidateForModal && (
        <ManageTransitionsModal
          candidate={selectedCandidateForModal}
          isOpen={isTransitionsModalOpen}
          onOpenChange={(isOpen) => {
            setIsTransitionsModalOpen(isOpen);
            if (!isOpen) setSelectedCandidateForModal(null);
          }}
          onUpdateCandidate={onUpdateCandidate}
          onRefreshCandidateData={onRefreshCandidateData}
          availableStages={availableStages}
        />
      )}
      <AlertDialog open={!!candidateToDelete} onOpenChange={(open) => { if(!open) setCandidateToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the candidate <strong>{candidateToDelete?.name}</strong> and all associated records (resume history, transition history).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCandidateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete}>Delete Candidate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

