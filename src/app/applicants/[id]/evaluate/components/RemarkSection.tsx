"use client";

import React, { useRef, useState, useEffect } from 'react';
import { MessageSquare, Loader2, CheckCircle, X, BarChart3 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Interviewer } from '../types';

interface RemarkSectionProps {
  remarkText: string;
  savingRemark: boolean;
  remarkSaved: boolean;
  interviewers: Interviewer[];
  allEvaluations: Map<string, any>;
  onRemarkChange: (text: string, event?: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClose?: () => void;
  onReportClick?: () => void;
  // Theme preference settings
  evaluateHeaderBackgroundType?: 'image' | 'gradient' | 'solid';
  evaluateHeaderBackgroundImage?: string | null;
  evaluateHeaderBackgroundGradient?: string | null;
  evaluateHeaderBackgroundColor?: string;
  evaluateHeaderTextColor?: string;
}

export function RemarkSection({
  remarkText,
  savingRemark,
  remarkSaved,
  interviewers,
  allEvaluations,
  onRemarkChange,
  onClose,
  onReportClick,
  // Theme preference settings with defaults
  evaluateHeaderBackgroundType = 'gradient',
  evaluateHeaderBackgroundImage = null,
  evaluateHeaderBackgroundGradient = 'linear-gradient(135deg, hsl(179 67% 66%), hsl(238 74% 61%))',
  evaluateHeaderBackgroundColor = '220 25% 97%',
  evaluateHeaderTextColor = '0 0% 0%',
}: RemarkSectionProps) {
  const remarkTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // Auto-open on mobile when component mounts (first time only)
  useEffect(() => {
    if (isMobile && !hasOpenedOnce) {
      setIsOpen(true);
      setHasOpenedOnce(true);
    }
  }, [isMobile, hasOpenedOnce]);

  // Check if all evaluations are complete
  const allEvaluationsComplete = React.useMemo(() => {
    if (interviewers.length === 0) return false;
    return interviewers.every(interviewer => {
      const evaluation = allEvaluations.get(interviewer.userId);
      return evaluation && evaluation.personalityScores && evaluation.personalityScores.length > 0;
    });
  }, [interviewers, allEvaluations]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Dynamic style based on theme preferences - matches desktop implementation
  const dynamicStyle: React.CSSProperties = {
    background: evaluateHeaderBackgroundType === 'image' && evaluateHeaderBackgroundImage
      ? `url(${evaluateHeaderBackgroundImage})`
      : evaluateHeaderBackgroundType === 'gradient'
        ? evaluateHeaderBackgroundGradient || 'linear-gradient(135deg, hsl(179 67% 66%), hsl(238 74% 61%))'
        : `hsl(${evaluateHeaderBackgroundColor})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: evaluateHeaderTextColor,
    border: 'none'
  };

  // Unified render for mobile and tablet - Show as Dialog popup with FAB
  return (
    <>
      {/* Floating Action Buttons - shown when dialog is closed */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 flex flex-col items-end gap-3 z-40">
          {allEvaluationsComplete && (
            <Button
              onClick={onReportClick}
              className="h-12 px-5 rounded-full shadow-lg flex items-center gap-2"
              style={dynamicStyle}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">See Report</span>
            </Button>
          )}

          <Button
            onClick={() => setIsOpen(true)}
            className="h-12 px-5 rounded-full shadow-lg flex items-center gap-2"
            style={dynamicStyle}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">Remark to Interviewer</span>
          </Button>
        </div>
      )}

      {/* Dialog Popup */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[80vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Remark to interviewer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              ref={remarkTextareaRef}
              value={remarkText}
              onChange={(e) => onRemarkChange(e.target.value, e)}
              placeholder="Enter your interview remarks about the Applicant..."
              className="min-h-[150px] text-base resize-none"
            />
            <div className="flex items-center justify-between gap-2 mt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                {savingRemark ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : remarkSaved ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Saved</span>
                  </>
                ) : null}
              </div>
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Noted
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

