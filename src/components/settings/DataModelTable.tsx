import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Database, Loader2, Trash2 } from 'lucide-react';
import type { DataModel } from '@/lib/types';

interface DataModelTableProps {
  dataModels: DataModel[];
  isLoading: boolean;
  onEdit: (dataModel: DataModel) => void;
  onDelete?: (dataModelId: string) => void;
}

const DataModelTable: React.FC<DataModelTableProps> = ({ 
  dataModels, 
  isLoading, 
  onEdit, 
  onDelete 
}) => {
  if (isLoading) {
    return (
 
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading data models...</span>
          </div>
       
    );
  }

  if (!dataModels || dataModels.length === 0) {
    return (
    
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Data Models</h3>
            <p className="text-muted-foreground mb-4">
              No data models have been defined yet. Create your first data model to get started.
            </p>
          </div>
      
    );
  }

  const getModelTypeIcon = (modelType: string) => {
    switch (modelType.toLowerCase()) {
      case 'candidate': return <Database className="h-4 w-4" />;
      case 'position': return <Database className="h-4 w-4" />;
      case 'user': return <Database className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getModelTypeColor = (modelType: string) => {
    switch (modelType.toLowerCase()) {
      case 'candidate': return 'bg-blue-100 text-blue-800';
      case 'position': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-purple-100 text-purple-800';
      default: return 'bg-muted text-foreground';
    }
  };

  const formatSchema = (schema: any): string => {
    if (!schema) return 'No schema defined';
    try {
      if (typeof schema === 'string') {
        return schema;
      }
      return JSON.stringify(schema, null, 2);
    } catch {
      return 'Invalid schema format';
    }
  };

  return (
   
      
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Schema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataModels.map((dataModel) => (
              <TableRow key={dataModel.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getModelTypeIcon(dataModel.modelType)}
                    <span>{dataModel.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getModelTypeColor(dataModel.modelType)}>
                    {dataModel.modelType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate" title={dataModel.description}>
                      {dataModel.description || 'No description'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="text-sm font-mono bg-muted px-2 py-1 rounded truncate" 
                         title={formatSchema(dataModel.schema)}>
                      {formatSchema(dataModel.schema)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={dataModel.isActive ? 'default' : 'secondary'}>
                    {dataModel.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(dataModel)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(dataModel.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
 
  );
};

export default DataModelTable; 