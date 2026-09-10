"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExclamationTriangleIcon as AlertTriangle, InformationCircleIcon as Info } from '@heroicons/react/24/outline';
import {
  parseHeadcountWarningStatus,
  shouldKeepHeadcountWarningOpen,
} from './headcount-warning-modal-utils';

interface HeadcountWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHeadcount?: () => void;
  applicantName: string;
  positionTitle?: string;
  errorMessage: string;
}

export function HeadcountWarningModal({
  isOpen,
  onClose,
  onCreateHeadcount,
  applicantName,
  positionTitle,
  errorMessage
}: HeadcountWarningModalProps) {
  const shouldStayOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (isOpen) {
      shouldStayOpenRef.current = true;
    }
  }, [isOpen]);

  const headcountStatus = parseHeadcountWarningStatus(errorMessage);
  const isNoPosition = !positionTitle;

  const handleOpenChange = (open: boolean) => {
    if (shouldKeepHeadcountWarningOpen(open, shouldStayOpenRef.current)) {
      return;
    }

    if (!open) {
      shouldStayOpenRef.current = false;
      onClose();
    }
  };

  const handleClose = () => {
    shouldStayOpenRef.current = false;
    onClose();
  };

  const handleCreateHeadcount = () => {
    shouldStayOpenRef.current = false;
    onCreateHeadcount?.();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      modal={true}
    >
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Status Change Blocked - Headcount Constraint
          </DialogTitle>
          <DialogDescription>
            The status change to "Hired" has been blocked due to insufficient headcount availability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-800">
                  Status Change Blocked
                </p>
                <p className="text-sm text-red-700">
                  {applicantName} cannot be hired for {positionTitle || 'this position'} because there are no available headcounts.
                </p>
                <p className="text-sm text-red-600">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>

          {headcountStatus && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="mb-2 text-sm font-medium text-foreground">Current Headcount Status</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-foreground">{headcountStatus.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">{headcountStatus.vacant}</div>
                  <div className="text-xs text-muted-foreground">Vacant</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">{headcountStatus.filled}</div>
                  <div className="text-xs text-muted-foreground">Filled</div>
                </div>
              </div>
            </div>
          )}

          {isNoPosition && (
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-primary">No Position Assigned</p>
                  <p className="text-sm text-muted-foreground">
                    This applicant is not assigned to any position. Please assign a position first before attempting to hire.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">What You Can Do</p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>- Add more headcounts to this position</li>
                  <li>- Assign the Applicant to a different position with available headcounts</li>
                  <li>- Wait for existing headcounts to become available</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {!isNoPosition && onCreateHeadcount && (
            <Button onClick={handleCreateHeadcount}>
              Create New Headcount
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
