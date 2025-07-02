// src/components/candidates/CandidateKanbanView.tsx
"use client";

import type { Candidate, CandidateStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from 'react';
import { CandidateDetailModal } from './CandidateDetailModal';
import { Pencil, Trash2, MoveRight, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CandidateKanbanViewProps {
  candidates: Candidate[];
  statuses: CandidateStatus[];
  onMoveCandidate?: (candidate: Candidate, newStatus: CandidateStatus) => void;
}

export function CandidateKanbanView({ candidates, statuses, onMoveCandidate }: CandidateKanbanViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidateSummary, setSelectedCandidateSummary] = useState<Partial<Candidate> & { id: string; name: string } | null>(null);
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<CandidateStatus | null>(null);
  const [loading, setLoading] = useState(false); // For skeleton loader
  const [addingStatus, setAddingStatus] = useState<CandidateStatus | null>(null);

  const candidatesByStatus = statuses.reduce((acc, status) => {
    acc[status] = candidates.filter(c => c.status === status);
    return acc;
  }, {} as Record<CandidateStatus, Candidate[]>);

  const handleCardClick = (candidate: Candidate) => {
    setSelectedCandidateSummary({
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      status: candidate.status,
      position: candidate.position,
      fitScore: candidate.fitScore,
      parsedData: candidate.parsedData 
    });
    setIsModalOpen(true);
  };

  // Drag and drop handlers
  const handleDragStart = (candidate: Candidate) => {
    setDraggedCandidate(candidate);
  };
  const handleDragEnd = () => {
    setDraggedCandidate(null);
    setDragOverStatus(null);
  };
  const handleDragOver = (status: CandidateStatus, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStatus(status);
  };
  const handleDrop = (status: CandidateStatus) => {
    if (draggedCandidate && draggedCandidate.status !== status) {
      onMoveCandidate?.(draggedCandidate, status);
    }
    setDraggedCandidate(null);
    setDragOverStatus(null);
  };

  // Skeleton loader for columns/cards
  if (loading) {
    return (
      <div className="w-full min-h-[300px] bg-background rounded-lg p-6 flex gap-4 overflow-x-auto">
        {statuses.map((status, idx) => (
          <div key={status} className="flex-shrink-0 w-72 md:w-80 bg-muted rounded-xl shadow p-4 flex flex-col gap-3 animate-pulse">
            <div className="h-6 w-2/3 bg-muted rounded mb-2" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg mb-2" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[400px] bg-background rounded-lg p-4 flex gap-4 overflow-x-auto">
      {statuses.map(status => (
        <div
          key={status}
          className={`flex-shrink-0 w-72 md:w-80 flex flex-col h-full transition-all ${dragOverStatus === status ? 'ring-2 ring-primary/60 bg-accent/60' : ''}`}
          onDragOver={e => handleDragOver(status, e)}
          onDrop={() => handleDrop(status)}
        >
          <Card className="flex flex-col h-full shadow-md border border-border bg-card">
            <CardHeader className="p-3 sm:p-4 border-b sticky top-0 bg-card z-10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg capitalize">{status}</CardTitle>
                <span className="text-xs font-semibold text-muted-foreground bg-muted rounded px-2 py-0.5">{candidatesByStatus[status]?.length || 0}</span>
              </div>
              <button
                className="ml-auto flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium px-2 py-1 rounded hover:bg-accent transition"
                onClick={() => setAddingStatus(status)}
                title={`Add card to ${status}`}
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </CardHeader>
            <ScrollArea className="flex-grow">
              <CardContent className="p-3 sm:p-4 space-y-3 min-h-[150px]">
                {candidatesByStatus[status]?.length > 0 ? (
                  candidatesByStatus[status].map(candidate => (
                    <div
                      key={candidate.id}
                      onClick={() => handleCardClick(candidate)}
                      className="cursor-pointer group"
                      draggable
                      onDragStart={() => handleDragStart(candidate)}
                      onDragEnd={handleDragEnd}
                    >
                      <Card className={`p-3 hover:shadow-lg transition-shadow bg-card flex flex-col gap-2 relative ${draggedCandidate?.id === candidate.id ? 'opacity-60' : ''}`}> 
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={(candidate.parsedData as any)?.personal_info?.avatar_url || `https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar"/>
                            <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate" title={candidate.name}>{candidate.name}</p>
                            <p className="text-xs text-muted-foreground truncate" title={candidate.position?.title || 'N/A'}>{candidate.position?.title || 'N/A'}</p>
                          </div>
                          {/* Quick actions (edit/move/delete) */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition absolute right-2 top-2 z-10">
                            <button className="p-1 rounded hover:bg-accent" title="Edit"><Pencil className="w-4 h-4 text-blue-500" /></button>
                            <button className="p-1 rounded hover:bg-accent" title="Move"><MoveRight className="w-4 h-4 text-gray-500" /></button>
                            <button className="p-1 rounded hover:bg-accent" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
                          </div>
                        </div>
                        {candidate.fitScore !== undefined && candidate.fitScore !== null && (
                          <p className="text-xs text-muted-foreground mt-1.5">Fit Score: <span className="font-semibold text-foreground">{candidate.fitScore}%</span></p>
                        )}
                      </Card>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground text-center py-4">No candidates here.</p>
                  </div>
                )}
              </CardContent>
            </ScrollArea>
            {/* Add Card Modal/Placeholder */}
            {addingStatus === status && (
              <div className="p-3 border-t bg-muted">
                <div className="flex gap-2 items-center">
                  <Input placeholder="Candidate name..." className="flex-1" />
                  <Button size="sm" variant="default" onClick={() => setAddingStatus(null)}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingStatus(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}
