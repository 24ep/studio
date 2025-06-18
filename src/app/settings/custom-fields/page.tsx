
// src/app/settings/custom-fields/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { CustomFieldDefinition, CustomFieldType, CustomFieldOption } from '@/lib/types';
import { CUSTOM_FIELD_TYPES } from '@/lib/types';
import { PlusCircle, Edit3, Trash2, ListChecks, Save, Loader2, ServerCrash, ShieldAlert, Settings2, X } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const customFieldOptionSchemaClient = z.object({
  value: z.string().min(1, "Option value is required"),
  label: z.string().min(1, "Option label is required"),
});

const customFieldFormSchema = z.object({
  model_name: z.enum(['Candidate', 'Position'], { required_error: "Model is required" }),
  field_key: z.string().min(1, "Field key is required").regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores."),
  label: z.string().min(1, "Label is required"),
  field_type: z.enum(CUSTOM_FIELD_TYPES as [CustomFieldType, ...CustomFieldType[]], { required_error: "Field type is required" }),
  options: z.array(customFieldOptionSchemaClient).optional(),
  is_required: z.boolean().optional().default(false),
  sort_order: z.coerce.number().int().optional().default(0),
});

type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>;

export default function CustomFieldsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<CustomFieldDefinition | null>(null);
  const [definitionToDelete, setDefinitionToDelete] = useState<CustomFieldDefinition | null>(null);

  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldFormSchema),
    defaultValues: { model_name: 'Candidate', field_key: '', label: '', field_type: 'text', options: [], is_required: false, sort_order: 0 },
  });

  const { fields: optionsFields, append: appendOption, remove: removeOption, replace: replaceOptions } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const watchFieldType = form.watch("field_type");

  const fetchDefinitions = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/custom-field-definitions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch definitions' }));
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        throw new Error(errorData.message);
      }
      const data: CustomFieldDefinition[] = await response.json();
      setDefinitions(data);
    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, pathname, signIn]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CUSTOM_FIELDS_MANAGE')) {
        setFetchError("You do not have permission to manage custom field definitions.");
        setIsLoading(false);
      } else {
        fetchDefinitions();
      }
    }
  }, [sessionStatus, session, fetchDefinitions, pathname, signIn]);

  const handleOpenModal = (definition: CustomFieldDefinition | null = null) => {
    setEditingDefinition(definition);
    if (definition) {
      form.reset({
        model_name: definition.model_name,
        field_key: definition.field_key,
        label: definition.label,
        field_type: definition.field_type,
        options: definition.options || [],
        is_required: definition.is_required || false,
        sort_order: definition.sort_order || 0,
      });
      replaceOptions(definition.options || []);
    } else {
      form.reset({ model_name: 'Candidate', field_key: '', label: '', field_type: 'text', options: [], is_required: false, sort_order: 0 });
      replaceOptions([]);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: CustomFieldFormValues) => {
    const url = editingDefinition ? `/api/settings/custom-field-definitions/${editingDefinition.id}` : '/api/settings/custom-field-definitions';
    const method = editingDefinition ? 'PUT' : 'POST';

    const payload = editingDefinition ? {
        label: data.label,
        field_type: data.field_type,
        options: ['select_single', 'select_multiple'].includes(data.field_type) ? data.options : null,
        is_required: data.is_required,
        sort_order: data.sort_order,
    } : data;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to ${editingDefinition ? 'update' : 'create'} definition`);
      
      toast({ title: `Definition ${editingDefinition ? 'Updated' : 'Created'}`, description: `Definition "${result.label}" was successfully ${editingDefinition ? 'updated' : 'created'}.` });
      setIsModalOpen(false);
      fetchDefinitions();
    } catch (error) {
      toast({ title: `Error ${editingDefinition ? 'Updating' : 'Creating'} Definition`, description: (error as Error).message, variant: "destructive" });
    }
  };

  const confirmDelete = (definition: CustomFieldDefinition) => {
    setDefinitionToDelete(definition);
  };

  const handleDelete = async () => {
    if (!definitionToDelete) return;
    try {
      const response = await fetch(`/api/settings/custom-field-definitions/${definitionToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete definition');
      }
      toast({ title: "Definition Deleted", description: `Definition "${definitionToDelete.label}" has been deleted.` });
      fetchDefinitions();
    } catch (error) {
      toast({ title: "Error Deleting Definition", description: (error as Error).message, variant: "destructive" });
    } finally {
      setDefinitionToDelete(null);
    }
  };

  if (sessionStatus === 'loading' || (isLoading && !fetchError && definitions.length === 0 && sessionStatus === 'authenticated')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Data</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
         {fetchError === "You do not have permission to manage custom field definitions." ? (
            <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
         ) : (
            <Button onClick={fetchDefinitions} className="btn-hover-primary-gradient">Try Again</Button>
         )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="flex items-center text-2xl"><Settings2 className="mr-3 h-6 w-6 text-primary"/>Custom Field Definitions</CardTitle>
            <CardDescription>
              Define custom fields that can be associated with Candidates or Positions.
              These fields are stored in a flexible JSONB column. The actual rendering of these fields on candidate/position forms is a future enhancement.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenModal()} className="btn-primary-gradient mt-2 sm:mt-0">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Field Definition
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading && definitions.length === 0 ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading definitions...</p>
            </div>
          ) : definitions.length === 0 && !fetchError ? (
            <p className="text-muted-foreground text-center py-8">No custom field definitions yet.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Field Key</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {definitions.map((def) => (
                    <TableRow key={def.id}>
                      <TableCell className="font-medium">{def.label}</TableCell>
                      <TableCell><Badge variant="outline">{def.model_name}</Badge></TableCell>
                      <TableCell><code className="text-xs bg-muted/50 px-1 rounded">{def.field_key}</code></TableCell>
                      <TableCell>{def.field_type}</TableCell>
                      <TableCell>{def.is_required ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{def.sort_order}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(def)} className="mr-1 h-8 w-8">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(def)} className="text-destructive hover:text-destructive h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingDefinition ? 'Edit' : 'Add New'} Custom Field Definition</DialogTitle>
            <DialogDescription>
              Define a new custom field. The 'Field Key' should be unique for the selected model.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow pr-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 pl-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="model_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!!editingDefinition}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Candidate">Candidate</SelectItem>
                            <SelectItem value="Position">Position</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {!!editingDefinition && <p className="text-xs text-muted-foreground">Model cannot be changed after creation.</p>}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="field_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field Key *</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., linkedin_url" disabled={!!editingDefinition} /></FormControl>
                        <FormMessage />
                        {!!editingDefinition && <p className="text-xs text-muted-foreground">Field key cannot be changed after creation.</p>}
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label *</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., LinkedIn Profile URL" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="field_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field Type *</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            if (!['select_single', 'select_multiple'].includes(value)) {
                                replaceOptions([]); 
                            }
                        }} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select field type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {CUSTOM_FIELD_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name="sort_order"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Sort Order</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                </div>

                {['select_single', 'select_multiple'].includes(watchFieldType) && (
                  <div className="space-y-3 border p-3 rounded-md">
                    <Label className="text-sm font-medium">Options for Select</Label>
                    {optionsFields.map((optionField, index) => (
                      <div key={optionField.id} className="flex items-end gap-2 p-2 border rounded bg-muted/30">
                        <FormField
                          control={form.control}
                          name={`options.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel htmlFor={`option-value-${index}`} className="text-xs">Value</FormLabel>
                              <FormControl><Input id={`option-value-${index}`} {...field} placeholder="Option Value" className="text-xs h-8" /></FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`options.${index}.label`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel htmlFor={`option-label-${index}`} className="text-xs">Label</FormLabel>
                              <FormControl><Input id={`option-label-${index}`} {...field} placeholder="Option Label" className="text-xs h-8" /></FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeOption(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendOption({ value: '', label: '' })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                    </Button>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="is_required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 pt-2">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="font-normal">Field is Required</FormLabel>
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4 sticky bottom-0 bg-dialog pb-1">
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={form.formState.isSubmitting} className="btn-primary-gradient">
                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    {editingDefinition ? 'Save Changes' : 'Create Definition'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {definitionToDelete && (
        <AlertDialog open={!!definitionToDelete} onOpenChange={(open) => { if(!open) setDefinitionToDelete(null);}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the custom field definition "<strong>{definitionToDelete.label}</strong>".
                This does not delete data already stored in candidate/position records under this field's key, but the definition will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDefinitionToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
                Delete Definition
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
