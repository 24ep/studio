"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-hot-toast";

import type { ApiKey } from "./ai-api-keys-utils";

export function useAiApiKeyEditing({
  apiKeys,
  onSaveKeys,
  setApiKeys,
}: {
  apiKeys: ApiKey[];
  onSaveKeys: (apiKeys: ApiKey[]) => Promise<void>;
  setApiKeys: Dispatch<SetStateAction<ApiKey[]>>;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEditing = useCallback((apiKey: ApiKey) => {
    setEditingKey(apiKey.key);
    setEditValue(apiKey.key);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingKey(null);
    setEditValue("");
  }, []);

  const saveEditing = useCallback(async () => {
    if (!editingKey || !editValue.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    const updatedKeys = apiKeys.map((apiKey) =>
      apiKey.key === editingKey
        ? { ...apiKey, key: editValue.trim() }
        : apiKey
    );
    setApiKeys(updatedKeys);
    setEditingKey(null);
    setEditValue("");

    try {
      await onSaveKeys(updatedKeys);
      toast.success("API key updated");
    } catch {
      // The persistence action restores the server state and reports the error.
    }
  }, [apiKeys, editValue, editingKey, onSaveKeys, setApiKeys]);

  return {
    cancelEditing,
    editingKey,
    editValue,
    saveEditing,
    setEditValue,
    startEditing,
  };
}
