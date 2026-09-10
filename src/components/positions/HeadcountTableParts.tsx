"use client";

import { Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { renderCustomFieldValue } from '@/lib/customFieldUtils';
import type { CustomFieldDefinition, Headcount } from '@/lib/types';

import type { HeadcountSLAData, HeadcountTypeOption } from './hooks/use-headcount-tab-data';
import { formatHeadcountRequestDateGroupLabel } from './headcount-table-utils';
import {
  HeadcountApprovalCell,
  HeadcountApplicantCell,
  HeadcountAttachmentCount,
  HeadcountDateCell,
  HeadcountEmployeeCell,
  HeadcountMemoCell,
  HeadcountRowActions,
  HeadcountSLABadge,
  HeadcountStatusBadge,
  HeadcountTypeBadge,
} from './HeadcountTableCells';

export function HeadcountRequestDateGroupRow({
  columnCount,
  groupCount,
  requestDate,
}: {
  columnCount: number;
  groupCount: number;
  requestDate: string;
}) {
  return (
    <TableRow className="bg-muted/50">
      <TableCell colSpan={columnCount} className="font-medium py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            Request Date: {formatHeadcountRequestDateGroupLabel(requestDate)}
          </span>
          <Badge variant="outline" className="ml-2">
            {groupCount} headcount{groupCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function HeadcountDataRow({
  customFieldDefinitions,
  headcount,
  headcountSLA,
  headcountTypeOptions,
  onDelete,
  onEdit,
  onManageAttachments,
}: {
  customFieldDefinitions: CustomFieldDefinition[];
  headcount: Headcount;
  headcountSLA?: HeadcountSLAData;
  headcountTypeOptions: HeadcountTypeOption[];
  onDelete: (headcountId: string) => void;
  onEdit: (headcount: Headcount) => void;
  onManageAttachments: (headcount: Headcount) => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <HeadcountTypeBadge headcount={headcount} headcountTypeOptions={headcountTypeOptions} />
      </TableCell>
      <TableCell>
        <HeadcountStatusBadge headcount={headcount} />
      </TableCell>
      <TableCell>
        <HeadcountApprovalCell headcount={headcount} />
      </TableCell>
      <TableCell>
        <HeadcountDateCell value={headcount.requestDate} />
      </TableCell>
      <TableCell>
        <HeadcountDateCell value={headcount.onboardingDate} />
      </TableCell>
      <TableCell>
        <HeadcountSLABadge slaData={headcountSLA} />
      </TableCell>
      <TableCell>
        <HeadcountApplicantCell headcount={headcount} />
      </TableCell>
      <TableCell>
        <HeadcountMemoCell memoId={headcount.memoId} />
      </TableCell>
      <TableCell>
        <HeadcountEmployeeCell employeeId={headcount.employeeId} />
      </TableCell>
      {customFieldDefinitions.map((definition) => (
        <TableCell key={definition.id}>
          {renderCustomFieldValue(definition, headcount.customFields?.[definition.field_code])}
        </TableCell>
      ))}
      <TableCell>
        <HeadcountAttachmentCount count={headcount.attachments?.length || 0} />
      </TableCell>
      <TableCell>
        <HeadcountRowActions
          headcount={headcount}
          onDelete={onDelete}
          onEdit={onEdit}
          onManageAttachments={onManageAttachments}
        />
      </TableCell>
    </TableRow>
  );
}
