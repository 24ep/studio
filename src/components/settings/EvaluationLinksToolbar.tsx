"use client";

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  isEvalLinkStatus,
  type EvalLinkStatus,
} from './evaluation-links-tab-utils';

interface EvaluationLinksToolbarProps {
  q: string;
  status: EvalLinkStatus;
  onQChange: (value: string) => void;
  onStatusChange: (value: EvalLinkStatus) => void;
}

export function EvaluationLinksToolbar({
  q,
  status,
  onQChange,
  onStatusChange,
}: EvaluationLinksToolbarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Input
        placeholder="Search by token, applicant name or email"
        value={q}
        onChange={(event) => onQChange(event.target.value)}
        className="w-80"
      />
      <Select
        value={status}
        onValueChange={(value) => {
          if (isEvalLinkStatus(value)) {
            onStatusChange(value);
          }
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="revoked">Revoked</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
