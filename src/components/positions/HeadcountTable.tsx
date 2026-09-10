"use client";

import React from 'react';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CustomFieldDefinition, Headcount } from '@/lib/types';

import {
  HeadcountDataRow,
  HeadcountRequestDateGroupRow,
} from './HeadcountTableParts';
import type { HeadcountSLAData, HeadcountTypeOption } from './hooks/use-headcount-tab-data';
import {
  getHeadcountTableColumnCount,
  groupHeadcountsByRequestDate,
} from './headcount-table-utils';

interface HeadcountTableProps {
  customFieldDefinitions: CustomFieldDefinition[];
  headcountSLA: Record<string, HeadcountSLAData>;
  headcountTypeOptions: HeadcountTypeOption[];
  headcounts: Headcount[];
  onDelete: (headcountId: string) => void;
  onEdit: (headcount: Headcount) => void;
  onManageAttachments: (headcount: Headcount) => void;
}

export function HeadcountTable({
  customFieldDefinitions,
  headcountSLA,
  headcountTypeOptions,
  headcounts,
  onDelete,
  onEdit,
  onManageAttachments,
}: HeadcountTableProps) {
  const sortedGroups = groupHeadcountsByRequestDate(headcounts);
  const columnCount = getHeadcountTableColumnCount(customFieldDefinitions.length);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Approval</TableHead>
          <TableHead>Request Date</TableHead>
          <TableHead>Onboarding Date</TableHead>
          <TableHead>SLA</TableHead>
          <TableHead>Applicant</TableHead>
          <TableHead>Memo</TableHead>
          <TableHead>Emp ID</TableHead>
          {customFieldDefinitions.map((definition) => (
            <TableHead key={definition.id} className="min-w-[120px]">
              {definition.label}
            </TableHead>
          ))}
          <TableHead>Attachments</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedGroups.map(([requestDate, groupHeadcounts]) => (
          <React.Fragment key={requestDate}>
            <HeadcountRequestDateGroupRow
              columnCount={columnCount}
              groupCount={groupHeadcounts.length}
              requestDate={requestDate}
            />
            {groupHeadcounts.map((headcount) => (
              <HeadcountDataRow
                key={headcount.id}
                customFieldDefinitions={customFieldDefinitions}
                headcount={headcount}
                headcountSLA={headcountSLA[headcount.id]}
                headcountTypeOptions={headcountTypeOptions}
                onDelete={onDelete}
                onEdit={onEdit}
                onManageAttachments={onManageAttachments}
              />
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
