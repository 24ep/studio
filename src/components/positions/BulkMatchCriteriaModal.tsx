"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { TiptapEditorWithExpand } from "@/components/ui/wysiwyg-editors";
import { fetchDefaultPositionMatchCriteria } from "./position-system-settings-api";

interface BulkMatchCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (matchCriteria: string) => Promise<void>;
  selectedCount: number;
}

export function BulkMatchCriteriaModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: BulkMatchCriteriaModalProps) {
  const [matchCriteria, setMatchCriteria] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [defaultMatchCriteria, setDefaultMatchCriteria] = useState('');
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);

  // Fetch default match criteria when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchDefaultMatchCriteria = async () => {
        setIsLoadingDefault(true);
        try {
          setDefaultMatchCriteria(await fetchDefaultPositionMatchCriteria());
        } catch (error) {
          console.error('Error fetching default match criteria:', error);
          toast.error('Failed to load default match criteria');
        } finally {
          setIsLoadingDefault(false);
        }
      };
      fetchDefaultMatchCriteria();
    }
  }, [isOpen]);

  const handleSetDefault = () => {
    setMatchCriteria(defaultMatchCriteria);
    toast.success('Default match criteria loaded');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matchCriteria.trim()) {
      toast.error('Match criteria cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(matchCriteria);
      setMatchCriteria('');
      onClose();
    } catch (error) {
      console.error('Failed to update match criteria:', error);
      toast.error('Failed to update match criteria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setMatchCriteria('');
      setDefaultMatchCriteria('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Update Match Criteria</DialogTitle>
          <DialogDescription>
            Update the match criteria for {selectedCount} selected position{selectedCount !== 1 ? 's' : ''}.
            This will replace the existing match criteria for all selected positions.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="matchCriteria">Match Criteria</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSetDefault}
                disabled={isLoading || isLoadingDefault || !defaultMatchCriteria}
                className="flex items-center gap-2"
              >
                {isLoadingDefault ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Set Default
              </Button>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <TiptapEditorWithExpand
                value={matchCriteria}
                onChange={setMatchCriteria}
                placeholder="Enter the match criteria content..."
                className="min-h-[200px]"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Use the rich text editor to format your match criteria. Click "Set Default" to load the system default match criteria.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !matchCriteria.trim()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update {selectedCount} Position{selectedCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
