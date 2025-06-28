"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import UserGroupsTable from '@/components/settings/UserGroupsTable';
import UserGroupsForm from '@/components/settings/UserGroupsForm';
import UserGroupsModal from '@/components/settings/UserGroupsModal';

// Define the types matching your user groups schema
interface UserGroup {
  id: string;
  name: string;
  description?: string;
  members: string[];
}

export default function UserGroupsPage() {
  const { data: session, status } = useSession();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<UserGroup | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/user-groups');
      if (!response.ok) {
        throw new Error('Failed to fetch user groups');
      }
      const data = await response.json();
      setGroups(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGroups();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status, fetchGroups]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleModalOpen = (group: UserGroup | null = null) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };
  const handleSubmit = async (data: UserGroup) => {
    setIsSaving(true);
    try {
      const url = data.id ? `/api/settings/user-groups/${data.id}` : '/api/settings/user-groups';
      const method = data.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save user group');
      }
      toast.success(`User group ${data.id ? 'updated' : 'created'} successfully.`);
      setIsModalOpen(false);
      setEditingGroup(null);
      fetchGroups();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = (group: UserGroup) => {
    setDeletingGroup(group);
    setIsDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!deletingGroup) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/settings/user-groups/${deletingGroup.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete user group');
      }
      toast.success('User group deleted successfully.');
      setIsDeleteModalOpen(false);
      setDeletingGroup(null);
      fetchGroups();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingGroup(null);
  };

  return (
    <div>
      <UserGroupsTable
        groups={groups}
        isLoading={isLoading}
        onEdit={handleModalOpen}
        onDelete={handleDelete}
      />
      <UserGroupsForm
        open={isModalOpen}
        group={editingGroup}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
      <UserGroupsModal
        open={isDeleteModalOpen}
        group={deletingGroup}
        onClose={handleCancelDelete}
        onDelete={handleConfirmDelete}
      />
    </div>
  );
}

