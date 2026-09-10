"use client";

import { useState } from 'react';
import { AlertCircle, Loader2, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Applicant, Headcount } from '@/lib/types';
import { HeadcountAttachmentModal } from './HeadcountAttachmentModal';
import { HeadcountModal } from './HeadcountModal';
import type { HeadcountModalSaveData } from './HeadcountModalTypes';
import { HeadcountTable } from './HeadcountTable';
import { useHeadcountTabData } from './hooks/use-headcount-tab-data';

interface HeadcountTabProps {
  positionId: string;
  applicants: Applicant[];
  onHeadcountChange?: () => void;
}

export function HeadcountTab({ positionId, applicants, onHeadcountChange }: HeadcountTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [selectedHeadcount, setSelectedHeadcount] = useState<Headcount | null>(null);
  const [editingHeadcount, setEditingHeadcount] = useState<Headcount | null>(null);

  const {
    customFieldDefinitions,
    deleteHeadcount,
    error,
    headcountSLA,
    headcountTypeOptions,
    headcounts,
    loading,
    refreshSelectedHeadcount,
    saveHeadcount,
  } = useHeadcountTabData(positionId, onHeadcountChange);

  const handleCreateHeadcount = () => {
    setEditingHeadcount(null);
    setIsModalOpen(true);
  };

  const handleEditHeadcount = (headcount: Headcount) => {
    setEditingHeadcount(headcount);
    setIsModalOpen(true);
  };

  const handleDeleteHeadcount = async (headcountId: string) => {
    if (!confirm('Are you sure you want to delete this headcount?')) {
      return;
    }

    await deleteHeadcount(headcountId);
  };

  const handleManageAttachments = (headcount: Headcount) => {
    setSelectedHeadcount(headcount);
    setIsAttachmentModalOpen(true);
  };

  const handleAttachmentUpdate = async () => {
    if (!selectedHeadcount) {
      return;
    }

    const updatedHeadcount = await refreshSelectedHeadcount(selectedHeadcount.id);

    if (updatedHeadcount) {
      setSelectedHeadcount(updatedHeadcount);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingHeadcount(null);
  };

  const handleModalSave = async (headcountData: HeadcountModalSaveData) => {
    await saveHeadcount(headcountData, editingHeadcount);
    handleModalClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Headcount Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage headcount positions and assignments
          </p>
        </div>
        <Button onClick={handleCreateHeadcount}>
          <Plus className="h-4 w-4 mr-2" />
          Add Headcount
        </Button>
      </div>

      {headcounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No headcounts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first headcount position to get started
            </p>
            <Button onClick={handleCreateHeadcount}>
              <Plus className="h-4 w-4 mr-2" />
              Add Headcount
            </Button>
          </CardContent>
        </Card>
      ) : (
        <HeadcountTable
          customFieldDefinitions={customFieldDefinitions}
          headcountSLA={headcountSLA}
          headcountTypeOptions={headcountTypeOptions}
          headcounts={headcounts}
          onDelete={handleDeleteHeadcount}
          onEdit={handleEditHeadcount}
          onManageAttachments={handleManageAttachments}
        />
      )}

      <HeadcountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        headcount={editingHeadcount}
        applicants={applicants}
        positionId={positionId}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />

      <HeadcountAttachmentModal
        open={isAttachmentModalOpen}
        onOpenChange={setIsAttachmentModalOpen}
        headcount={selectedHeadcount}
        onClose={() => {
          setIsAttachmentModalOpen(false);
          setSelectedHeadcount(null);
        }}
        onUpdate={handleAttachmentUpdate}
      />
    </div>
  );
}
