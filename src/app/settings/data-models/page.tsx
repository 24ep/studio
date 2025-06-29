"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Loader2, ServerCrash } from 'lucide-react';
import DataModelTable from '@/components/settings/DataModelTable';
import DataModelForm from '@/components/settings/DataModelForm';
import DataModelModal from '@/components/settings/DataModelModal';
import type { DataModel } from '@/lib/types';

export default function DataModelsPage() {
  const { data: session, status } = useSession();
  const [dataModels, setDataModels] = useState<DataModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDataModel, setEditingDataModel] = useState<DataModel | null>(null);

  const fetchDataModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/data-models');
      if (!response.ok) {
        throw new Error(`Failed to fetch data models: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Validate that data is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array of data models');
      }
      
      setDataModels(data);
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch data models';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching data models:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDataModels();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status, fetchDataModels]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleModalOpen = (dataModel: DataModel | null = null) => {
    setEditingDataModel(dataModel);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDataModel(null);
  };

  const handleSubmit = async (dataModel: DataModel) => {
    setIsSaving(true);
    try {
      const url = dataModel.id ? `/api/settings/data-models/${dataModel.id}` : '/api/settings/data-models';
      const method = dataModel.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataModel),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save data model');
      }

      toast.success(`Data model ${dataModel.id ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      setEditingDataModel(null);
      fetchDataModels();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (dataModelId: string) => {
    if (!confirm('Are you sure you want to delete this data model? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/data-models/${dataModelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete data model');
      }

      toast.success('Data model deleted successfully');
      fetchDataModels();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddNewDataModel = async (data: DataModel) => {
    await handleSubmit(data);
  };

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Data Models</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={fetchDataModels} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Database className="mr-3 h-6 w-6 text-primary" /> Data Models
          </CardTitle>
          <CardDescription>
            Define and manage data models for candidates, positions, and other entities in your system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataModelModal onDataModelUpdate={handleAddNewDataModel} />
          
          <DataModelTable
            dataModels={dataModels}
            isLoading={isLoading}
            onEdit={handleModalOpen}
            onDelete={handleDelete}
          />
          
          <DataModelForm
            open={isModalOpen}
            dataModel={editingDataModel}
            onClose={handleModalClose}
            onSubmit={handleSubmit}
            isSaving={isSaving}
          />
        </CardContent>
      </Card>
    </div>
  );
}

