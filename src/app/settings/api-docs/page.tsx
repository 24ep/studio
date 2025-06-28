// src/app/api-docs/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import ApiDocsTable from '@/components/settings/ApiDocsTable';
import ApiDocsForm from '@/components/settings/ApiDocsForm';
import ApiDocsModal from '@/components/settings/ApiDocsModal';

// Define the types matching your API docs schema
interface ApiDoc {
  id: string;
  title: string;
  description: string;
  url: string;
}

export default function ApiDocsPage() {
  const { data: session, status } = useSession();
  const [docs, setDocs] = useState<ApiDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ApiDoc | null>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/api-docs');
      if (!response.ok) {
        throw new Error('Failed to fetch API docs');
      }
      const data = await response.json();
      setDocs(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDocs();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status, fetchDocs]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleModalOpen = (doc: ApiDoc | null = null) => {
    setEditingDoc(doc);
    setIsModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
  };
  const handleSubmit = async (data: any) => {
    // Implement submit logic
    setIsModalOpen(false);
    fetchDocs();
  };

  return (
    <div>
      <ApiDocsTable
        docs={docs}
        isLoading={isLoading}
        onEdit={handleModalOpen}
      />
      <ApiDocsForm
        open={isModalOpen}
        doc={editingDoc}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
      />
      <ApiDocsModal />
    </div>
  );
}
