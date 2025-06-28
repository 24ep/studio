"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import DataModelTable from '@/components/settings/DataModelTable';
import DataModelForm from '@/components/settings/DataModelForm';
import DataModelModal from '@/components/settings/DataModelModal';
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
import { Toggle } from '@/components/ui/toggle';
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
import {
  PlusCircle,
  Edit,
  Trash2,
  DatabaseZap,
  Loader2,
  AlertCircle,
  Shield,
  Save,
} from 'lucide-react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    const [currentModel, setCurrentModel] = useState<'Candidate' | 'Position'>('Candidate');
    const [formData, setFormData] = useState<any>({});
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
    
    const handleModalOpen = (field: CustomFieldDefinition | null = null, model: 'Candidate' | 'Position' = 'Candidate') => {
        setEditingField(field);
        setCurrentModel(model);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingField(null);
    };
    
    const handleSubmit = async (data: any) => {
        setIsModalOpen(false);
        fetchDefinitions();
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
                    <Button onClick={() => handleModalOpen(null, model)}>
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
                            ) : filteredDefs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No custom fields defined for {model}s yet.
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
                                        <Button variant="ghost" size="icon" onClick={() => handleModalOpen(def, model)} disabled={def.isSystemField}>
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
            
            <DataModelForm
                open={isModalOpen}
                definition={editingField}
                onClose={handleModalClose}
                onSubmit={handleSubmit}
            />
            <DataModelModal />
        </div>
    );
}

