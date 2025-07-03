"use client";
import { useState } from "react";

export default function ApiKeyManager() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKey = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me/api-key");
      const data = await res.json();
      if (res.ok) setApiKey(data.apiKey);
      else setError(data.error || "Failed to fetch API key");
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me/api-key", { method: "POST" });
      const data = await res.json();
      if (res.ok) setApiKey(data.apiKey);
      else setError(data.error || "Failed to generate API key");
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const revokeApiKey = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me/api-key", { method: "DELETE" });
      if (res.ok) setApiKey(null);
      else setError("Failed to revoke API key");
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white dark:bg-card rounded shadow">
      <h1 className="text-2xl font-bold mb-4">API Key Management</h1>
      <div className="mb-4">
        <button onClick={fetchApiKey} className="mr-2 px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>View API Key</button>
        <button onClick={generateApiKey} className="mr-2 px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>Generate New API Key</button>
        <button onClick={revokeApiKey} className="px-4 py-2 bg-red-600 text-white rounded" disabled={loading || !apiKey}>Revoke API Key</button>
      </div>
      {loading && <div className="mb-2 text-blue-600">Loading...</div>}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {apiKey && (
        <div className="mb-2">
          <span className="font-semibold">Your API Key:</span>
          <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded break-all select-all">
            <code>{apiKey}</code>
          </div>
          <div className="text-xs text-gray-500 mt-1">Keep this key secret. It provides access to your account via the API.</div>
        </div>
      )}
    </div>
  );
} 