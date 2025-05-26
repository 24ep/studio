
"use client";

import type { Candidate, CandidateStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface CandidateKanbanViewProps {
  candidates: Candidate[];
  statuses: CandidateStatus[];
}

export function CandidateKanbanView({ candidates, statuses }: CandidateKanbanViewProps) {
  const candidatesByStatus = statuses.reduce((acc, status) => {
    acc[status] = candidates.filter(c => c.status === status);
    return acc;
  }, {} as Record<CandidateStatus, Candidate[]>);

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {statuses.map(status => (
          <div key={status} className="flex-shrink-0 w-[300px]">
            <Card className="h-full flex flex-col">
              <CardHeader className="p-4">
                <CardTitle className="text-lg capitalize">{status} ({candidatesByStatus[status]?.length || 0})</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-grow">
                <CardContent className="p-4 space-y-3 min-h-[200px]">
                  {candidatesByStatus[status]?.length > 0 ? (
                    candidatesByStatus[status].map(candidate => (
                      <Link href={`/candidates/${candidate.id}`} key={candidate.id} passHref>
                        <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer bg-card">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={(candidate.parsedData as any)?.personal_info?.avatar_url || `https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar"/>
                              <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground truncate">{candidate.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{candidate.position?.title || 'N/A'}</p>
                            </div>
                          </div>
                          {candidate.fitScore !== undefined && candidate.fitScore !== null && (
                             <p className="text-xs text-muted-foreground mt-1">Fit Score: {candidate.fitScore}%</p>
                          )}
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center pt-4">No candidates in this stage.</p>
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
