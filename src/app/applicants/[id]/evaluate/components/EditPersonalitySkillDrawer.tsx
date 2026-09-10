"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import type { EvaluationQuestion } from '../types';
import { EditPersonalitySkillDrawerContent } from './EditPersonalitySkillDrawerContent';

interface EditPersonalitySkillDrawerProps {
  editingQuestionIndex: number | null;
  question: EvaluationQuestion | null;
  isMobile: boolean;
  onClose: () => void;
  onScoreChange: (questionId: string, score: number) => void;
  onNotesChange: (questionId: string, notes: string) => void;
}

export function EditPersonalitySkillDrawer({
  editingQuestionIndex,
  question,
  isMobile,
  onClose,
  onScoreChange,
  onNotesChange,
}: EditPersonalitySkillDrawerProps) {
  if (editingQuestionIndex === null || !question) return null;

  if (isMobile) {
    return (
      <Dialog open={editingQuestionIndex !== null} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="fixed bottom-0 left-1/2 top-auto translate-x-[-50%] translate-y-0 w-screen max-w-none h-[90vh] p-0 overflow-hidden rounded-t-3xl rounded-b-none border-0 shadow-2xl flex flex-col"
          dialogId="edit-personality-skill-modal"
          hideCloseButton
        >
          <VisuallyHidden>
            <DialogHeader>Edit Personality Skill - {question.traitName}</DialogHeader>
          </VisuallyHidden>
          <DialogHeader className="border-b flex-shrink-0 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {question.traitName}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close personality skill editor"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4">
            <EditPersonalitySkillDrawerContent
              notesId="notes"
              question={question}
              onClose={onClose}
              onScoreChange={onScoreChange}
              onNotesChange={onNotesChange}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={editingQuestionIndex !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] p-0 overflow-y-auto">
        <SheetHeader className="border-b flex-shrink-0 p-6">
          <SheetTitle className="text-xl font-semibold">
            {question.traitName}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 p-6">
          <EditPersonalitySkillDrawerContent
            notesId="notes-drawer"
            question={question}
            onClose={onClose}
            onScoreChange={onScoreChange}
            onNotesChange={onNotesChange}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

