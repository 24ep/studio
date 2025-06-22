"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signIn, useSession } from 'next-auth/react';
import {
  PlusCircle,
  Edit,
  Trash2,
  DatabaseZap,
  Loader2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

// Define the types matching the Prisma schema
type FieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT';

interface CustomFieldDefinition {
  id: string;
  model: 'Candidate' | 'Position';
  name: string;
  label: string;
  type: FieldType;
  options: string[];
  placeholder?: string | null;
  defaultValue?: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  isSystemField: boolean;
  order: number;
}

const fieldSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Name must be lowercase alphanumeric with underscores.'),
    label: z.string().min(3, 'Label is required'),
    type: z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT']),
    options: z.string().optional(),
    placeholder: z.string().optional(),
    defaultValue: z.string().optional(),
    isRequired: z.boolean().default(false),
    isFilterable: z.boolean().default(false),
});


export default function DataModelsPage() {
    const { data: session, status } = useSession();
    const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
    const [formData, setFormData] = useState<z.infer<typeof fieldSchema>>({
        name: '',
        label: '',
        type: 'TEXT',
        isRequired: false,
        isFilterable: false,
    });
    const [formErrors, setFormErrors] = useState<z.ZodError | null>(null);

    const fetchDefinitions = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/settings/custom-field-definitions');
            if (!response.ok) {
                throw new Error('Failed to fetch data models');
            }
            const data = await response.json();
            setDefinitions(data);
        } catch (e: any) {
            setError(e.message);
            toast.error(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchDefinitions();
        } else if (status === 'unauthenticated') {
            signIn();
        }
    }, [status, fetchDefinitions]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);
    
    const handleModalOpen = (field: CustomFieldDefinition | null = null) => {
        setEditingField(field);
        if (field) {
            setFormData({
                name: field.name,
                label: field.label,
                type: field.type,
                options: field.options?.join(', '),
                placeholder: field.placeholder || '',
                defaultValue: field.defaultValue || '',
                isRequired: field.isRequired,
                isFilterable: field.isFilterable,
            });
        } else {
            setFormData({
                name: '',
                label: '',
                type: 'TEXT',
                isRequired: false,
                isFilterable: false,
                options: '',
                placeholder: '',
                defaultValue: '',
            });
        }
        setFormErrors(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingField(null);
    };
    
    const handleSubmit = async (e: React.FormEvent, model: 'Candidate' | 'Position') => {
        e.preventDefault();
        setFormErrors(null);
        setIsSaving(true);
    
        const validation = fieldSchema.safeParse(formData);
        if (!validation.success) {
            setFormErrors(validation.error);
            setIsSaving(false);
            return;
        }

        const payload: any = {
            ...validation.data,
            model,
        };

        if (payload.options) {
            payload.options = payload.options.split(',').map((opt: string) => opt.trim());
        }

        const url = editingField
            ? `/api/settings/custom-field-definitions/${editingField.id}`
            : '/api/settings/custom-field-definitions';
        const method = editingField ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save field');
            }

            toast.success(`Field has been ${editingField ? 'updated' : 'created'}.`);
            
            handleModalClose();
            fetchDefinitions(); // Refresh data
        } catch (e: any) {
            console.error('Error in settings/data-models:', e);
            toast.error(e.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (fieldId: string) => {
        if (!confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/settings/custom-field-definitions/${fieldId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete field');
            }

            toast.success('Field has been deleted.');
            fetchDefinitions(); // Refresh data
        } catch (e: any) {
            console.error('Error in settings/data-models:', e);
            toast.error(e.message);
        }
    };

    const renderTable = (model: 'Candidate' | 'Position') => {
        const filteredDefs = definitions.filter(def => def.model === model);

        return (
            <div>
                <div className="flex justify-end mb-4">
                    <Button onClick={() => handleModalOpen()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Field
                    </Button>
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Label</TableHead>
                                <TableHead>Name (Key)</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Required</TableHead>
                                <TableHead>System</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        <Loader2 className="inline-block animate-spin mr-2" /> Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredDefs.map(def => (
                                <TableRow key={def.id}>
                                    <TableCell className="font-medium">{def.label}</TableCell>
                                    <TableCell>
                                        <span className="inline-block border rounded px-2 py-0.5 text-xs font-mono bg-muted">{def.name}</span>
                                    </TableCell>
                                    <TableCell>{def.type}</TableCell>
                                    <TableCell>{def.isRequired ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>
                                        {def.isSystemField ? (
                                            <Shield className="h-5 w-5 text-blue-500" />
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleModalOpen(def)} disabled={def.isSystemField}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(def.id)} disabled={def.isSystemField}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    if (status !== 'authenticated') {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (session.user.role !== 'Admin') {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                <AlertCircle className="mr-2" />
                You do not have permission to access this page.
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold flex items-center">
                    <DatabaseZap className="mr-3 text-blue-500" />
                    Data Model Management
                </h1>
                <p className="text-muted-foreground mt-1">
                    Define and manage the data attributes for your Candidates and Positions.
                </p>
            </header>

            <Tabs defaultValue="candidates">
                <TabsList>
                    <TabsTrigger value="candidates">Candidates</TabsTrigger>
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                </TabsList>
                <TabsContent value="candidates" className="mt-4">
                    {renderTable('Candidate')}
                </TabsContent>
                <TabsContent value="positions" className="mt-4">
                    {renderTable('Position')}
                </TabsContent>
            </Tabs>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
                        <DialogDescription>
                            Define the properties for this field. The &quot;Name (Key)&quot; is used programmatically and cannot be changed after creation.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => handleSubmit(e, 'Candidate')} className="space-y-4">
                        <div>
                            <Label htmlFor="label">Label</Label>
                            <Input id="label" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />
                            {formErrors?.flatten().fieldErrors.label && <p className="text-red-500 text-sm mt-1">{formErrors.flatten().fieldErrors.label}</p>}
                        </div>
                        <div>
                            <Label htmlFor="name">Name (Key)</Label>
                            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={!!editingField} />
                             {formErrors?.flatten().fieldErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.flatten().fieldErrors.name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="type">Field Type</Label>
                            <Select value={formData.type} onValueChange={(value: FieldType) => setFormData({...formData, type: value})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TEXT">Text</SelectItem>
                                    <SelectItem value="TEXTAREA">Text Area</SelectItem>
                                    <SelectItem value="NUMBER">Number</SelectItem>
                                    <SelectItem value="DATE">Date</SelectItem>
                                    <SelectItem value="BOOLEAN">Yes/No (Boolean)</SelectItem>
                                    <SelectItem value="SELECT">Select</SelectItem>
                                    <SelectItem value="MULTISELECT">Multi-Select</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(formData.type === 'SELECT' || formData.type === 'MULTISELECT') && (
                            <div>
                                <Label htmlFor="options">Options (comma-separated)</Label>
                                <Input id="options" value={formData.options} onChange={e => setFormData({...formData, options: e.target.value})} />
                            </div>
                        )}
                        <div>
                            <Label htmlFor="placeholder">Placeholder</Label>
                            <Input id="placeholder" value={formData.placeholder} onChange={e => setFormData({...formData, placeholder: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="defaultValue">Default Value</Label>
                            <Input id="defaultValue" value={formData.defaultValue} onChange={e => setFormData({...formData, defaultValue: e.target.value})} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="isRequired" checked={formData.isRequired} onCheckedChange={checked => setFormData({...formData, isRequired: checked})} />
                            <Label htmlFor="isRequired">Is Required?</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="isFilterable" checked={formData.isFilterable} onCheckedChange={checked => setFormData({...formData, isFilterable: checked})} />
                            <Label htmlFor="isFilterable">Is Filterable?</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleModalClose}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingField ? 'Save Changes' : 'Create Field'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

