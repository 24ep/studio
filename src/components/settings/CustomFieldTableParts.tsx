import {
  Edit3,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CustomFieldDefinition } from '@/lib/types';
import {
  countFieldsByModel,
  FIELD_TYPE_LABELS,
  getFieldTypeIcon,
  getModelIcon,
  getVisibilityBadges,
} from './CustomFieldTableUtils';

interface CustomFieldSummaryCardsProps {
  fields: CustomFieldDefinition[];
}

interface CustomFieldTableRowProps {
  field: CustomFieldDefinition;
  onEdit: (field: CustomFieldDefinition) => void;
  onDelete: (field: CustomFieldDefinition) => void;
}

export function CustomFieldSummaryCards({ fields }: CustomFieldSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <CustomFieldSummaryCard label="Total Fields" value={fields.length} />
      <CustomFieldSummaryCard label="Applicant Fields" value={countFieldsByModel(fields, 'Applicant')} />
      <CustomFieldSummaryCard label="Position Fields" value={countFieldsByModel(fields, 'Position')} />
      <CustomFieldSummaryCard label="User Fields" value={countFieldsByModel(fields, 'User')} />
    </div>
  );
}

export function CustomFieldTableRow({ field, onEdit, onDelete }: CustomFieldTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{field.label}</div>
          <div className="text-sm text-muted-foreground font-mono">
            {field.field_key}
          </div>
          {field.field_code && (
            <div className="text-xs text-muted-foreground">
              Code: {field.field_code}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          {getFieldTypeIcon(field.field_type)}
          <span className="text-sm">
            {FIELD_TYPE_LABELS[field.field_type as keyof typeof FIELD_TYPE_LABELS]}
          </span>
        </div>
        {field.options && field.options.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {field.options.length} option{field.options.length !== 1 ? 's' : ''}
          </div>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          {getModelIcon(field.model_name)}
          <span className="text-sm">{field.model_name}</span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1">
          {getVisibilityBadges(field)}
        </div>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          {field.is_required && (
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          )}
          {field.allowCustomOptions && (
            <Badge variant="outline" className="text-xs">
              Custom Options
            </Badge>
          )}
          <div className="text-xs text-muted-foreground">
            Order: {field.sort_order}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(field)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(field)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function CustomFieldSummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
