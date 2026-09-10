import {
  Building,
  Calendar,
  Eye,
  FileText,
  Filter,
  Settings,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { CustomFieldDefinition } from '@/lib/types';

const FIELD_TYPE_ICONS = {
  text: FileText,
  textarea: FileText,
  number: FileText,
  boolean: FileText,
  date: Calendar,
  select_single: FileText,
  select_multiple: FileText,
};

const MODEL_ICONS = {
  Applicant: User,
  Position: Building,
  User: User,
  Headcount: Building,
};

export const FIELD_TYPE_LABELS = {
  text: 'Text',
  textarea: 'Text Area',
  number: 'Number',
  boolean: 'Boolean',
  date: 'Date',
  select_single: 'Single Select',
  select_multiple: 'Multi Select',
};

export function countFieldsByModel(fields: CustomFieldDefinition[], modelName: string) {
  return fields.filter((field) => field.model_name === modelName).length;
}

export function getFieldTypeIcon(type: string) {
  const Icon = FIELD_TYPE_ICONS[type as keyof typeof FIELD_TYPE_ICONS] || FileText;
  return <Icon className="h-4 w-4" />;
}

export function getModelIcon(model: string) {
  const Icon = MODEL_ICONS[model as keyof typeof MODEL_ICONS] || User;
  return <Icon className="h-4 w-4" />;
}

export function getVisibilityBadges(field: CustomFieldDefinition) {
  return [
    field.showInFilter && (
      <Badge key="filter" variant="secondary" className="text-xs">
        <Filter className="mr-1 h-3 w-3" />
        Filter
      </Badge>
    ),
    field.showInApplicantDetail && (
      <Badge key="detail" variant="secondary" className="text-xs">
        <Eye className="mr-1 h-3 w-3" />
        Detail
      </Badge>
    ),
    field.showInFullApplicantDetail && (
      <Badge key="full-detail" variant="secondary" className="text-xs">
        <Eye className="mr-1 h-3 w-3" />
        Full Detail
      </Badge>
    ),
    field.showInTaskBoardFilter && (
      <Badge key="taskboard" variant="secondary" className="text-xs">
        <Settings className="mr-1 h-3 w-3" />
        Task Board
      </Badge>
    ),
    field.showInPositionSettings && (
      <Badge key="position-settings" variant="secondary" className="text-xs">
        <Settings className="mr-1 h-3 w-3" />
        Position Settings
      </Badge>
    ),
  ].filter(Boolean);
}
