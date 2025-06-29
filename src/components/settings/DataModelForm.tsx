import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Loader2, Save, X, Database, Code } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { DataModel } from '@/lib/types';

const dataModelFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  modelType: z.string().min(1, 'Model type is required'),
  description: z.string().optional(),
  schema: z.string().optional(),
  isActive: z.boolean().default(true),
});

type DataModelFormValues = z.infer<typeof dataModelFormSchema>;

interface DataModelFormProps {
  open: boolean;
  dataModel?: DataModel | null;
  onClose: () => void;
  onSubmit: (data: DataModel) => Promise<void>;
  isSaving?: boolean;
}

const DataModelForm: React.FC<DataModelFormProps> = ({ 
  open, 
  dataModel, 
  onClose, 
  onSubmit, 
  isSaving = false 
}) => {
  const form = useForm<DataModelFormValues>({
    resolver: zodResolver(dataModelFormSchema),
    defaultValues: {
      name: '',
      modelType: 'Candidate',
      description: '',
      schema: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (dataModel) {
      form.reset({
        name: dataModel.name,
        modelType: dataModel.modelType as 'Candidate' | 'Position' | 'User' | 'Custom',
        description: dataModel.description || '',
        schema: typeof dataModel.schema === 'string' ? dataModel.schema : JSON.stringify(dataModel.schema, null, 2),
        isActive: dataModel.isActive,
      });
    } else {
      form.reset({
        name: '',
        modelType: 'Candidate',
        description: '',
        schema: '',
        isActive: true,
      });
    }
  }, [dataModel, form]);

  const handleSubmit = (data: DataModelFormValues) => {
    let parsedSchema;
    if (data.schema) {
      try {
        parsedSchema = JSON.parse(data.schema);
      } catch {
        parsedSchema = data.schema;
      }
    }

    const dataModelData: DataModel = {
      id: dataModel?.id || '',
      name: data.name,
      modelType: data.modelType,
      description: data.description,
      schema: parsedSchema,
      isActive: data.isActive,
      createdAt: dataModel?.createdAt,
      updatedAt: dataModel?.updatedAt,
    };
    onSubmit(dataModelData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {dataModel ? 'Edit Data Model' : 'Create New Data Model'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., CandidateProfile, JobPosition"
                      />
                    </FormControl>
                    <FormDescription>
                      Unique name for this data model.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Candidate">Candidate</SelectItem>
                        <SelectItem value="Position">Position</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of entity this model represents.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what this data model is for..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of the data model's purpose.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Schema (JSON)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='{"type": "object", "properties": {...}}'
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormDescription>
                    JSON schema definition for this data model.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Model</FormLabel>
                    <FormDescription>
                      Enable or disable this data model.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Toggle
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isValid}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DataModelForm; 