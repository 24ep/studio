"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  buildSystemApiKeyCreatePayload,
  type SystemApiKey,
  type SystemApiKeyExpirationOption,
} from "./system-api-keys-utils";
import {
  createSystemApiKey,
  deleteSystemApiKey,
  fetchSystemApiKeys,
  updateSystemApiKeyActiveState,
} from "./system-api-keys-api";

export function useSystemApiKeysTab() {
  const [apiKeys, setApiKeys] = useState<SystemApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [newKeyExpiration, setNewKeyExpiration] = useState<SystemApiKeyExpirationOption>("never");
  const [newKeyCustomExpiration, setNewKeyCustomExpiration] = useState("");
  const [showCreatedKeyDialog, setShowCreatedKeyDialog] = useState(false);
  const [createdKey, setCreatedKey] = useState("");
  const [createdKeyName, setCreatedKeyName] = useState("");
  const [showCreatedKey, setShowCreatedKey] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      setApiKeys(await fetchSystemApiKeys());
    } catch (error) {
      toast.error("Failed to load API keys");
      console.error("Error fetching API keys:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  function resetCreateForm() {
    setNewKeyName("");
    setNewKeyDescription("");
    setNewKeyExpiration("never");
    setNewKeyCustomExpiration("");
  }

  function closeCreatedKeyDialog(open: boolean) {
    if (!open) {
      setShowCreatedKey(false);
      setCreatedKey("");
    }

    setShowCreatedKeyDialog(open);
  }

  async function handleCreateKey() {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setIsSaving(true);
    try {
      const data = await createSystemApiKey(buildSystemApiKeyCreatePayload({
        name: newKeyName,
        description: newKeyDescription,
        expiration: newKeyExpiration,
        customExpiration: newKeyCustomExpiration,
      }));

      setCreatedKey(data.apiKey);
      setCreatedKeyName(newKeyName);
      setShowCreateDialog(false);
      setShowCreatedKeyDialog(true);
      resetCreateForm();
      await fetchApiKeys();
      toast.success("API key created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create API key");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyKey() {
    try {
      await navigator.clipboard.writeText(createdKey);
      toast.success("API key copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  async function handleToggleActive(apiKey: SystemApiKey) {
    setTogglingId(apiKey.id);
    try {
      await updateSystemApiKeyActiveState(apiKey.id, !apiKey.isActive);
      await fetchApiKeys();
      toast.success(`API key ${apiKey.isActive ? "disabled" : "enabled"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update API key");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteKey(id: string) {
    setDeletingId(id);
    try {
      await deleteSystemApiKey(id);
      await fetchApiKeys();
      toast.success("API key deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete API key");
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  }

  return {
    apiKeys,
    createdKey,
    createdKeyName,
    deleteConfirmId,
    deletingId,
    isLoading,
    isSaving,
    newKeyCustomExpiration,
    newKeyDescription,
    newKeyExpiration,
    newKeyName,
    showCreatedKey,
    showCreatedKeyDialog,
    showCreateDialog,
    togglingId,
    actions: {
      closeCreatedKeyDialog,
      handleCopyKey,
      handleCreateKey,
      handleDeleteKey,
      handleToggleActive,
      setDeleteConfirmId,
      setNewKeyCustomExpiration,
      setNewKeyDescription,
      setNewKeyExpiration,
      setNewKeyName,
      setShowCreatedKey,
      setShowCreateDialog,
    },
  };
}
