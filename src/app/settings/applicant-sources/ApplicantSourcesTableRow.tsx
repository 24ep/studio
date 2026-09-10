"use client";

import { ArrowDown, ArrowUp, Edit3, GripVertical, Image as ImageIcon, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { convertMinIOUrlToSecureUrl } from '@/lib/imageUtils';
import type { ApplicantSource } from '@/lib/types';

export type ApplicantSourcesTableRowProps = {
  source: ApplicantSource;
  index: number;
  totalSources: number;
  isReordering: boolean;
  onEdit: (source: ApplicantSource) => void;
  onDelete: (source: ApplicantSource) => void;
  onReorder: (sourceId: string, newSortOrder: number) => void;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
};

export function ApplicantSourcesTableRow({
  source,
  index,
  totalSources,
  isReordering,
  onEdit,
  onDelete,
  onReorder,
  selected, onSelectedChange,
}: ApplicantSourcesTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Checkbox aria-label={`Select ${source.name}`} checked={selected} onCheckedChange={checked => onSelectedChange(checked === true)} />
      </TableCell>
      <TableCell>
        <ApplicantSourceLogo source={source} />
      </TableCell>
      <TableCell className="font-medium">{source.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {source.description || '-'}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {source.email || '-'}
      </TableCell>
      <TableCell>
        {source.allowSubSource ? (
          <Badge variant="secondary">Enabled</Badge>
        ) : (
          <Badge variant="outline">Disabled</Badge>
        )}
      </TableCell>
      <TableCell>
        <ApplicantSourceOrderControls
          source={source}
          index={index}
          totalSources={totalSources}
          isReordering={isReordering}
          onReorder={onReorder}
        />
      </TableCell>
      <TableCell>
        {source.isActive ? (
          <Badge variant="default">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </TableCell>
      <TableCell>
        <ApplicantSourceRowActions
          source={source}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}

function ApplicantSourceLogo({ source }: { source: ApplicantSource }) {
  if (source.logo) {
    return (
      <img
        src={convertMinIOUrlToSecureUrl(source.logo) || source.logo}
        alt={`${source.name} logo`}
        className="h-8 w-8 object-contain rounded-full"
      />
    );
  }

  return (
    <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
      <ImageIcon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function ApplicantSourceOrderControls({
  source,
  index,
  totalSources,
  isReordering,
  onReorder,
}: Pick<ApplicantSourcesTableRowProps, 'source' | 'index' | 'totalSources' | 'isReordering' | 'onReorder'>) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        disabled={index === 0 || isReordering}
        onClick={() => onReorder(source.id, source.sortOrder - 1)}
        aria-label={`Move ${source.name} up`}
        className="h-8 w-8"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center">{source.sortOrder}</span>
      <Button
        variant="ghost"
        size="icon"
        disabled={index === totalSources - 1 || isReordering}
        onClick={() => onReorder(source.id, source.sortOrder + 1)}
        aria-label={`Move ${source.name} down`}
        className="h-8 w-8"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ApplicantSourceRowActions({
  source,
  onEdit,
  onDelete,
}: Pick<ApplicantSourcesTableRowProps, 'source' | 'onEdit' | 'onDelete'>) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(source)}
        aria-label={`Edit ${source.name}`}
        className="h-8 w-8"
      >
        <Edit3 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(source)}
        aria-label={`Delete ${source.name}`}
        className="h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
