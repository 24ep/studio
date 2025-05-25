
"use client";

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
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileEdit, Trash2, Eye, Users } from 'lucide-react';
import type { Candidate, CandidateStatus, TransitionRecord } from '@/lib/types';
import { ManageTransitionsModal } from './ManageTransitionsModal';
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface CandidateTableProps {
  candidates: Candidate[];
  onUpdateCandidate: (candidateId: string, status: CandidateStatus, newTransitionHistory: TransitionRecord[]) => Promise<void>;
  onDeleteCandidate: (candidateId: string) => Promise<void>; 
  isLoading?: boolean;
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
    case 'On Hold': // Added On Hold to outline
      return 'outline';
    default:
      return 'outline';
  }
};

export function CandidateTable({ candidates, onUpdateCandidate, onDeleteCandidate, isLoading }: CandidateTableProps) {
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleManageTransitionsClick = (candidate: Candidate) => {
    setSelectedCandidateForModal(candidate);
    setIsModalOpen(true);
  };

  const handleViewDetails = (candidate: Candidate) => {
    toast({ title: "View Details", description: `Viewing details for ${candidate.name}. (Not implemented)` });
  };
  
  const handleDeleteClick = async (candidate: Candidate) => {
    // Basic confirmation, you might use an AlertDialog for better UX
    if (window.confirm(`Are you sure you want to delete ${candidate.name}?`)) {
      try {
        await onDeleteCandidate(candidate.id);
        toast({ title: "Candidate Deleted", description: `${candidate.name} has been deleted.` });
      } catch (error) {
        toast({ title: "Error Deleting Candidate", description: (error as Error).message || "Could not delete candidate.", variant: "destructive" });
      }
    }
  };

  const handleModalUpdateCandidate = async (updatedCandidate: Candidate) => {
    // The modal now provides the full updated candidate including new transition history.
    // We just need to pass the relevant parts to onUpdateCandidate prop.
    try {
      await onUpdateCandidate(updatedCandidate.id, updatedCandidate.status, updatedCandidate.transitionHistory);
      setIsModalOpen(false); // Close modal on successful update from modal
      // Optimistic update is handled by the parent page's state update after API call.
    } catch (error) {
      // Error is toasted by parent
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
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="w-[100px]">Fit Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="text-right w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar" />
                      <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">{candidate.name}</div>
                      <div className="text-xs text-muted-foreground">{candidate.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{candidate.position?.title || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">
                    {(candidate.parsedData as any)?.education?.[0] || 'Education N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={candidate.fitScore} className="h-2 w-[60px]" />
                    <span className="text-sm font-medium text-foreground">{candidate.fitScore}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(candidate.status)} className="capitalize">
                    {candidate.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(parseISO(candidate.updatedAt || candidate.createdAt || candidate.lastUpdateDate), "MMM d, yyyy")}
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
                      <DropdownMenuItem onClick={() => handleViewDetails(candidate)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleManageTransitionsClick(candidate)}>
                        <FileEdit className="mr-2 h-4 w-4" /> Manage Transitions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(candidate)} className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ManageTransitionsModal
        candidate={selectedCandidateForModal}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdateCandidate={handleModalUpdateCandidate} // This will now trigger the API call via props
      />
    </>
  );
}
