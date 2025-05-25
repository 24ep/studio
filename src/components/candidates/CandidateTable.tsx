
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileEdit, Trash2, Eye, Users, UploadCloud } from 'lucide-react';
import type { Candidate, CandidateStatus, TransitionRecord } from '@/lib/types';
import { ManageTransitionsModal } from './ManageTransitionsModal';
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link'; // Import Link

interface CandidateTableProps {
  candidates: Candidate[];
  onUpdateCandidate: (candidateId: string, status: CandidateStatus, newTransitionHistory?: TransitionRecord[]) => Promise<void>;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  onOpenUploadModal: (candidate: Candidate) => void;
  isLoading?: boolean;
  onRefreshCandidateData: (candidateId: string) => Promise<void>;
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

export function CandidateTable({ candidates, onUpdateCandidate, onDeleteCandidate, onOpenUploadModal, isLoading, onRefreshCandidateData }: CandidateTableProps) {
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<Candidate | null>(null);
  const [isTransitionsModalOpen, setIsTransitionsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleManageTransitionsClick = (candidate: Candidate) => {
    setSelectedCandidateForModal(candidate);
    setIsTransitionsModalOpen(true);
  };

  const handleDeleteClick = async (candidate: Candidate) => {
    // This confirmation will be handled by an AlertDialog in CandidatesPage
    // For now, directly call onDeleteCandidate if confirmation is managed by parent
    onDeleteCandidate(candidate.id);
  };

  const handleTransitionsModalUpdateCandidate = async (candidateId: string, status: CandidateStatus, newTransitionHistory?: TransitionRecord[]) => {
    try {
      await onUpdateCandidate(candidateId, status, newTransitionHistory);
      setIsTransitionsModalOpen(false);
      // Parent (CandidatesPage) will handle UI update and toast
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
              <TableHead className="w-[120px]">Resume</TableHead>
              <TableHead className="text-right w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={candidate.parsedData?.personal_info?.avatar_url || `https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar" />
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
                    { candidate.parsedData?.education?.[0]?.university || 'Education N/A'}
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
                  {format(parseISO(candidate.updatedAt || candidate.createdAt!), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-xs">
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
                      <DropdownMenuItem onClick={() => handleManageTransitionsClick(candidate)}>
                        <FileEdit className="mr-2 h-4 w-4" /> Manage Transitions
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => onOpenUploadModal(candidate)}>
                        <UploadCloud className="mr-2 h-4 w-4" /> Upload Resume
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDeleteCandidate(candidate.id)} className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive">
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
      {selectedCandidateForModal && (
        <ManageTransitionsModal
          candidate={selectedCandidateForModal}
          isOpen={isTransitionsModalOpen}
          onOpenChange={(isOpen) => {
            setIsTransitionsModalOpen(isOpen);
            if (!isOpen) setSelectedCandidateForModal(null);
          }}
          onUpdateCandidate={handleTransitionsModalUpdateCandidate}
          onRefreshCandidateData={onRefreshCandidateData}
        />
      )}
    </>
  );
}
