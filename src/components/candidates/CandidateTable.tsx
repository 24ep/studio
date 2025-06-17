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
import { MoreHorizontal, FileEdit, Trash2, Eye, Users, UploadCloud, Briefcase } from 'lucide-react';
import type { Candidate, CandidateStatus, Position, RecruitmentStage } from '@/lib/types';
import { ManageTransitionsModal } from './ManageTransitionsModal';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { AutoSizer, List, ListRowProps } from 'react-virtualized';
import React from 'react';

interface CandidateTableProps {
  candidates: Candidate[];
  availablePositions: Position[];
  availableStages: RecruitmentStage[]; // New prop
  onUpdateCandidate: (candidateId: string, status: CandidateStatus) => Promise<void>;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  onOpenUploadModal: (candidate: Candidate) => void;
  onEditPosition: (position: Position) => void;
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

const Row = React.memo(({ index, style, key }: ListRowProps) => {
  const candidate = candidates[index];
  const {
    availablePositions,
    availableStages,
    onUpdateCandidate,
    onDeleteCandidate,
    onOpenUploadModal,
    onEditPosition,
    onRefreshCandidateData
  } = data;
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
    // Fallback for non-string (e.g. Date object or number timestamp, though type says string)
    try {
      displayDate = format(new Date(dateValue as any), "MMM d, yyyy");
    } catch (e) {
       console.error("Failed to format non-string date for candidate " + candidate.id + ": " + dateValue, e);
       displayDate = 'Invalid Date';
    }
  }

  return (
    <TableRow key={key} style={style} className="hover:bg-muted/50 transition-colors">
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
            onClick={() => onEditPosition(candidate.position)}
            title={`Edit ${candidate.position.title}`}
          >
            {candidate.position.title}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </TableCell>
      <TableCell>
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
      <TableCell className="text-sm text-muted-foreground">
        {displayDate}
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
            <DropdownMenuItem onClick={() => onOpenUploadModal(candidate)}>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Resume
            </DropdownMenuItem>
            {candidate.position && (
              <DropdownMenuItem onClick={() => onEditPosition(candidate.position)}>
                <Briefcase className="mr-2 h-4 w-4" /> Edit Applied Job
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDeleteCandidate(candidate.id)} className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

export function CandidateTable({
  candidates,
  availablePositions,
  availableStages,
  onUpdateCandidate,
  onDeleteCandidate,
  onOpenUploadModal,
  onEditPosition,
  isLoading,
  onRefreshCandidateData
}: CandidateTableProps) {
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<Candidate | null>(null);
  const [isTransitionsModalOpen, setIsTransitionsModalOpen] = useState(false);

  const handleManageTransitionsClick = (candidate: Candidate) => {
    setSelectedCandidateForModal(candidate);
    setIsTransitionsModalOpen(true);
  };

  const handleEditPositionClick = (position: Position) => {
    onEditPosition(position);
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

  const itemData = {
    candidates,
    availablePositions,
    availableStages,
    onUpdateCandidate,
    onDeleteCandidate,
    onOpenUploadModal,
    onEditPosition,
    onRefreshCandidateData
  };

  return (
    <>
      <div className="border rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Candidate</TableHead>
              <TableHead>Applied Job</TableHead>
              <TableHead className="w-[100px]">Fit Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="w-[120px]">Resume</TableHead>
              <TableHead className="text-right w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <div style={{ height: 600 }}>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    rowCount={candidates.length}
                    rowHeight={48}
                    width={width}
                    rowRenderer={Row}
                  />
                )}
              </AutoSizer>
            </div>
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
    </>
  );
}
