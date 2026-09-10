"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import type { Applicant, Headcount, HeadcountType } from '@/lib/types';
import { readJsonOrFallback } from '../../lib/response-json';
import { HeadcountModalForm } from './HeadcountModalForm';
import type { HeadcountModalSaveData } from './HeadcountModalTypes';

interface HeadcountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headcount?: Headcount | null;
  applicants: Applicant[];
  positionId: string;
  onSave: (data: HeadcountModalSaveData) => Promise<void>;
  onClose: () => void;
}

export function HeadcountModal({
  open,
  onOpenChange,
  headcount,
  applicants,
  positionId,
  onSave,
  onClose
}: HeadcountModalProps) {
  // Headcount type options will be fetched from API
  const [headcountTypeOptions, setHeadcountTypeOptions] = useState<{ value: HeadcountType; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HeadcountModalSaveData>({
    type: 'new',
    status: 'pending',
    applicantId: null,
    onboardingDate: '',
    requestDate: '',
    notes: '',
    memoId: '',
    employeeId: '',
    customFields: {},
  });


  const isEdit = Boolean(headcount);

  useEffect(() => {
    fetchHeadcountTypeOptions();
  }, []);

  const fetchHeadcountTypeOptions = async () => {
    try {
      const response = await fetch('/api/settings/headcount-types');
      if (response.ok) {
        const options = await readJsonOrFallback<{ value: HeadcountType; label: string }[]>(response, []);
        setHeadcountTypeOptions(options);
      }
    } catch (error) {
      console.error('Error fetching headcount type options:', error);
      // Set default options if API fails
      setHeadcountTypeOptions([
        { value: 'promote', label: 'Promote' },
        { value: 'new', label: 'New' },
        { value: 'replace', label: 'Replace' },
      ]);
    }
  };

  useEffect(() => {
    if (headcount) {
      setFormData({
        type: headcount.type,
        status: headcount.status,
        applicantId: headcount.applicantId || null,
        onboardingDate: headcount.onboardingDate ? new Date(headcount.onboardingDate).toISOString().split('T')[0] : '',
        requestDate: headcount.requestDate ? new Date(headcount.requestDate).toISOString().split('T')[0] : '',
        notes: headcount.notes || '',
        memoId: headcount.memoId || '',
        employeeId: headcount.employeeId || '',
        customFields: headcount.customFields || {},
      });
    } else {
      // For new headcount, set defaults
      setFormData({
        type: 'new',
        status: 'pending',
        applicantId: null, // No Applicant assignment for new headcount
        onboardingDate: '',
        requestDate: new Date().toISOString().split('T')[0], // Default to today
        notes: '',
        memoId: '',
        employeeId: '',
        customFields: {},
      });
    }
  }, [headcount, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      toast.error('Please select a headcount type');
      return;
    }

    if (formData.status === 'filled' && !formData.applicantId) {
      toast.error('An applicant must be assigned when status is "filled". Please assign the applicant through the applicant details page first.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
      });
    } catch (error) {
      console.error('Error saving headcount:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(prev => ({
      ...prev,
      type: 'new',
      status: 'pending',
      applicantId: null,
      onboardingDate: prev.onboardingDate ?? '',
      requestDate: prev.requestDate ?? '',
      notes: '',
      memoId: '',
      employeeId: '',
      customFields: {},
    }));
    onClose();
  };

  const selectedApplicant = formData.applicantId
    ? applicants.find((applicant) => applicant.id === formData.applicantId) ?? null
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dialogId="headcount-modal">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Headcount' : 'Create New Headcount'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update headcount information and assignments'
              : 'Submit a new headcount request for approval'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <HeadcountModalForm
            formData={formData}
            headcountTypeOptions={headcountTypeOptions}
            isEdit={isEdit}
            loading={loading}
            positionId={positionId}
            selectedApplicant={selectedApplicant}
            setFormData={setFormData}
            onCancel={handleClose}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
