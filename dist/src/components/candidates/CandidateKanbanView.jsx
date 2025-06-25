// src/components/candidates/CandidateKanbanView.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from 'react';
import { CandidateDetailModal } from './CandidateDetailModal';
export function CandidateKanbanView({ candidates, statuses }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCandidateSummary, setSelectedCandidateSummary] = useState(null);
    const candidatesByStatus = statuses.reduce((acc, status) => {
        acc[status] = candidates.filter(c => c.status === status);
        return acc;
    }, {});
    const handleCardClick = (candidate) => {
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
    return (<>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex space-x-4 p-4">
          {statuses.map(status => {
            var _a, _b;
            return (<div key={status} className="flex-shrink-0 w-72 md:w-80">
              <Card className="flex flex-col h-full shadow-sm">
                <CardHeader className="p-3 sm:p-4 border-b sticky top-0 bg-card z-10">
                  <CardTitle className="text-base sm:text-lg capitalize">{status} ({((_a = candidatesByStatus[status]) === null || _a === void 0 ? void 0 : _a.length) || 0})</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-grow">
                  <CardContent className="p-3 sm:p-4 space-y-3 min-h-[150px]">
                    {((_b = candidatesByStatus[status]) === null || _b === void 0 ? void 0 : _b.length) > 0 ? (candidatesByStatus[status].map(candidate => {
                    var _a, _b, _c, _d;
                    return (<div key={candidate.id} onClick={() => handleCardClick(candidate)} className="cursor-pointer">
                          <Card className="p-3 hover:shadow-lg transition-shadow bg-background dark:bg-muted/30">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={((_b = (_a = candidate.parsedData) === null || _a === void 0 ? void 0 : _a.personal_info) === null || _b === void 0 ? void 0 : _b.avatar_url) || `https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar"/>
                                <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground truncate" title={candidate.name}>{candidate.name}</p>
                                <p className="text-xs text-muted-foreground truncate" title={((_c = candidate.position) === null || _c === void 0 ? void 0 : _c.title) || 'N/A'}>{((_d = candidate.position) === null || _d === void 0 ? void 0 : _d.title) || 'N/A'}</p>
                              </div>
                            </div>
                            {candidate.fitScore !== undefined && candidate.fitScore !== null && (<p className="text-xs text-muted-foreground mt-1.5">Fit Score: <span className="font-semibold text-foreground">{candidate.fitScore}%</span></p>)}
                          </Card>
                        </div>);
                })) : (<div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground text-center py-4">No candidates here.</p>
                      </div>)}
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>);
        })}
        </div>
        <ScrollBar orientation="horizontal"/>
      </ScrollArea>
      {selectedCandidateSummary && (<CandidateDetailModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} candidateSummary={selectedCandidateSummary}/>)}
    </>);
}
