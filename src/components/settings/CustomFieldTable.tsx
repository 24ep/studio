import { useCallback } from 'react';
import { FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CustomFieldDefinition } from '@/lib/types';
import {
  CustomFieldSummaryCards,
  CustomFieldTableRow,
} from './CustomFieldTableParts';

interface CustomFieldTableProps {
  fields: CustomFieldDefinition[];
  isLoading: boolean;
  onEdit: (field: CustomFieldDefinition) => void;
  onDelete: (field: CustomFieldDefinition) => void;
}

export default function CustomFieldTable({
  fields,
  isLoading,
  onEdit,
  onDelete,
}: CustomFieldTableProps) {
  const handleEdit = useCallback((field: CustomFieldDefinition) => {
    onEdit(field);
  }, [onEdit]);

  const handleDelete = useCallback((field: CustomFieldDefinition) => {
    onDelete(field);
  }, [onDelete]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-2">Loading custom fields...</span>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No custom fields defined yet.</p>
        <p className="text-sm">Create your first custom field to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CustomFieldSummaryCards fields={fields} />

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <CustomFieldTableRow
                key={field.id}
                field={field}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
