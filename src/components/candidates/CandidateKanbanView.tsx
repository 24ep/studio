
"use client";

import type { Candidate, CandidateStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
    <ScrollArea className="w-full rounded-md border"> {/* Outer ScrollArea for vertical scrolling of status rows */}
      <div className="flex flex-col space-y-4 p-4"> {/* Vertical layout for status rows */}
        {statuses.map(status => (
          <div key={status} className="w-full"> {/* Each status is a full-width row */}
            <Card className="flex flex-col shadow-sm">
              <CardHeader className="p-3 sm:p-4 border-b">
                <CardTitle className="text-base sm:text-lg capitalize">{status} ({candidatesByStatus[status]?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 min-h-[150px]"> {/* Adjusted min-height */}
                {candidatesByStatus[status]?.length > 0 ? (
                  <ScrollArea className="whitespace-nowrap"> {/* Horizontal ScrollArea for candidates */}
                    <div className="flex w-max space-x-3 p-3 sm:p-4"> {/* Horizontal layout for candidate cards */}
                      {candidatesByStatus[status].map(candidate => (
                        <Link href={`/candidates/${candidate.id}`} key={candidate.id} passHref>
                          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer bg-background dark:bg-muted/30 w-[260px] sm:w-[280px] flex-shrink-0">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={(candidate.parsedData as any)?.personal_info?.avatar_url || `https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar"/>
                                <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground truncate" title={candidate.name}>{candidate.name}</p>
                                <p className="text-xs text-muted-foreground truncate" title={candidate.position?.title || 'N/A'}>{candidate.position?.title || 'N/A'}</p>
                              </div>
                            </div>
                            {candidate.fitScore !== undefined && candidate.fitScore !== null && (
                               <p className="text-xs text-muted-foreground mt-1.5">Fit Score: <span className="font-semibold text-foreground">{candidate.fitScore}%</span></p>
                            )}
                          </Card>
                        </Link>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-full p-4">
                    <p className="text-sm text-muted-foreground text-center py-4">No candidates in this stage.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
