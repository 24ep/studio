"use client";

import React, { memo } from 'react';
import { TableRow } from '@/components/ui/table';
import { useApplicantDetail } from './hooks/use-applicant-detail';
import { cn } from '@/lib/utils';
import type { Applicant, ApplicantSource } from '@/lib/types';
import type { ApplicantSettings } from './applicant-settings-types';
import { ApplicantTableRowColumnCell } from './ApplicantTableRowCells';
import {
  DEFAULT_APPLICANT_TABLE_COLUMN_ORDER,
  getApplicantTableRowStateClass,
  getRowHeightStyle,
  getRowPaddingClass,
} from './applicant-table-row-utils';

export {
  getRowHeightStyle,
  getRowPaddingClass,
} from './applicant-table-row-utils';

interface ApplicantTableRowProps {
  applicant: Applicant;
  settings?: ApplicantSettings;
  isJobMatchEnabled: boolean;
  availableRecruiter: { id: string; name: string }[];
  availableSources: ApplicantSource[];
  stageNames: Record<string, string>;
  stageColors: Record<string, string>;
  canEditApplicants: boolean;
  canAssignSource: boolean;
  assigningRecruiter: string | null;
  assigningSource: string | null;
  onAssignRecruiter: (applicantId: string, recruiterId: string | null) => void;
  onAssignSource: (applicantId: string, sourceId: string | null, subSource?: string | null) => void;
  onResetAssigning: () => void;
  onOpenDetail: (applicantId: string, applicantName: string) => void;
  togglePin: (applicant: Applicant) => void;
  onPinToggle?: () => void;
  rowHeightStyle: React.CSSProperties;
  rowPaddingClass: string;
  prefixCells?: React.ReactNode;
  suffixCells?: React.ReactNode;
}

const ApplicantTableRowComponent = ({
  applicant,
  settings,
  isJobMatchEnabled,
  availableRecruiter,
  availableSources,
  stageNames,
  stageColors,
  canEditApplicants,
  canAssignSource,
  assigningRecruiter,
  assigningSource,
  onAssignRecruiter,
  onAssignSource,
  onResetAssigning,
  onOpenDetail,
  togglePin,
  onPinToggle,
  rowHeightStyle,
  rowPaddingClass,
  prefixCells,
  suffixCells,
}: ApplicantTableRowProps) => {
  const columnOrder = settings?.columnOrder || DEFAULT_APPLICANT_TABLE_COLUMN_ORDER;
  const { handleTogglePin } = useApplicantDetail(applicant.id);
  const isUnread = applicant.isRead !== true;

  const notifyRefresh = () => {
    onPinToggle?.();
  };

  const onTogglePin = async () => {
    try {
      await handleTogglePin();
      notifyRefresh();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  return (
    <TableRow
      className={cn(
        'hover:bg-muted/40 transition-colors group',
        rowPaddingClass,
        getApplicantTableRowStateClass(applicant),
      )}
      style={rowHeightStyle}
      data-applicant-id={applicant.id}
    >
      {prefixCells}
      {columnOrder.map((columnKey) => (
        <ApplicantTableRowColumnCell
          key={`${applicant.id}-${columnKey}`}
          applicant={applicant}
          availableRecruiter={availableRecruiter}
          availableSources={availableSources}
          assigningRecruiter={assigningRecruiter}
          assigningSource={assigningSource}
          canAssignSource={canAssignSource}
          canEditApplicants={canEditApplicants}
          columnKey={columnKey}
          isJobMatchEnabled={isJobMatchEnabled}
          isUnread={isUnread}
          onAssignRecruiter={onAssignRecruiter}
          onAssignSource={onAssignSource}
          onOpenDetail={onOpenDetail}
          onResetAssigning={onResetAssigning}
          onTogglePin={onTogglePin}
          settings={settings}
          stageColors={stageColors}
          stageNames={stageNames}
          togglePin={togglePin}
        />
      ))}
      {suffixCells}
    </TableRow>
  );
};

export const ApplicantTableRow = memo(ApplicantTableRowComponent);
