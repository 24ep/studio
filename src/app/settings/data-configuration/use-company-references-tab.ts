"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { CompanyReference } from '@/lib/types';
import {
  deleteCompanyReference,
  fetchCompanyReferences,
  loadCompanyReferenceFromAppKit,
  saveCompanyReference,
  type CompanyReferenceFormData,
} from './company-references-tab-api';

export function useCompanyReferencesTab() {
  const [companies, setCompanies] = useState<CompanyReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyReference | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyReference | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appKitLoad, setAppKitLoad] = useState<{
    environment: 'development' | 'production';
    percent: number;
    message: string;
  } | null>(null);
  const isImporting = appKitLoad !== null;

  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      setCompanies(await fetchCompanyReferences());
    } catch (error) {
      console.error('Failed to fetch company references:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch company references');
      toast.error('Failed to load company references');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCreateModal = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const openEditModal = (company: CompanyReference) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const handleSave = async (data: CompanyReferenceFormData) => {
    try {
      const saved = await saveCompanyReference(data, editingCompany);
      setCompanies((prev) => (
        editingCompany
          ? prev.map((company) => company.id === saved.id ? saved : company)
          : [...prev, saved]
      ));
      toast.success(editingCompany ? 'Company reference updated' : 'Company reference created');
      closeModal();
    } catch (error) {
      console.error('Failed to save company reference:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save company reference');
    }
  };

  const handleDeleteSelected = async () => {
    if (!companyToDelete) return;

    try {
      await deleteCompanyReference(companyToDelete.id);
      setCompanies((prev) => prev.filter((company) => company.id !== companyToDelete.id));
      setCompanyToDelete(null);
      toast.success('Company reference deleted');
    } catch (error) {
      console.error('Failed to delete company reference:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete company reference');
    }
  };

  const handleLoadFromAppKit = async (environment: 'development' | 'production') => {
    try {
      setAppKitLoad({ environment, percent: 10, message: "Initializing AppKit request" });
      const imported = await loadCompanyReferenceFromAppKit(environment);
      setAppKitLoad((current) => current ? { ...current, percent: 45, message: "Downloading company references" } : null);
      setAppKitLoad((current) => current ? { ...current, percent: 70, message: "Applying reference updates" } : null);
      setCompanies((prev) => {
        const importedById = new Map(imported.companies.map((company) => [company.id, company]));
        const merged = prev.map((company) => importedById.get(company.id) || company);
        const existingIds = new Set(prev.map((company) => company.id));
        return [...merged, ...imported.companies.filter((company) => !existingIds.has(company.id))]
          .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));
      });
      setAppKitLoad((current) => current ? { ...current, percent: 95, message: "Refreshing list" } : null);
      toast.success(`Synchronized ${imported.total} companies (${imported.created} new, ${imported.updated} updated)`);
    } catch (error) {
      console.error('Failed to load company reference from AppKit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load company reference from AppKit');
    } finally {
      setAppKitLoad(null);
    }
  };

  return {
    companies,
    isLoading,
    fetchError,
    editingCompany,
    companyToDelete,
    isModalOpen,
    appKitLoad,
    isImporting,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,
    handleDeleteSelected,
    handleLoadFromAppKit,
    setCompanyToDelete,
  };
}
