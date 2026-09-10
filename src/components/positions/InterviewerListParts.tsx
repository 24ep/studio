"use client";

import { Calendar, Loader2, Mail, Plus, User, Users, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import type { Interviewer } from './interviewer-tab-types';
import {
  formatInterviewerAddedDate,
  getInterviewerEmptyStateCopy,
} from './interviewer-tab-utils';

interface InterviewerEmptyStateProps {
  searchTerm: string;
  onAddFirst: () => void;
}

export function InterviewerEmptyState({ searchTerm, onAddFirst }: InterviewerEmptyStateProps) {
  const emptyState = getInterviewerEmptyStateCopy(searchTerm);

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{emptyState.title}</h3>
        <p className="text-muted-foreground text-center mb-4">{emptyState.description}</p>
        {emptyState.showAddButton && (
          <Button onClick={onAddFirst}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Interviewer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function InterviewerCard({
  interviewer,
  isRemoving,
  onRemove,
}: {
  interviewer: Interviewer;
  isRemoving: boolean;
  onRemove: (userId: string, userName: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium truncate">{interviewer.userName}</h4>
                <Badge variant="secondary" className="text-xs">
                  {interviewer.userRole}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground truncate">{interviewer.userEmail}</p>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Added {formatInterviewerAddedDate(interviewer.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(interviewer.userId, interviewer.userName)}
            disabled={isRemoving}
            className="text-destructive hover:text-destructive"
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
