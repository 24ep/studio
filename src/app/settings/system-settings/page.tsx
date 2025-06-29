"use client";

import React, { useEffect, useState, useCallback } from "react";
import SystemSettingsTable from "@/components/settings/SystemSettingsTable";
import SystemSettingsModal from "@/components/settings/SystemSettingsModal";
import SystemSettingsForm from "@/components/settings/SystemSettingsForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, Info } from "lucide-react";
import { useSession } from "next-auth/react";
import type { SystemSetting } from "@/lib/types";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Application: "Branding and general application settings.",
  Email: "SMTP and email delivery settings.",
  Webhooks: "Integration endpoints for automation and external services.",
  "API Keys": "Keys for external APIs and integrations.",
  Sidebar: "Sidebar appearance and theme settings.",
  "Login Page": "Login page appearance and content.",
  General: "Other system-wide settings.",
};

type GroupedSettings = Record<string, SystemSetting[]>;

function groupSettings(settings: SystemSetting[]): GroupedSettings {
  const getSettingCategory = (key: string): string => {
    if (key.startsWith("app")) return "Application";
    if (key.startsWith("smtp")) return "Email";
    if (key.startsWith("login")) return "Login Page";
    if (key.startsWith("sidebar")) return "Sidebar";
    if (key.includes("Webhook") || key.includes("Url")) return "Webhooks";
    if (key.includes("ApiKey") || key.includes("Key")) return "API Keys";
    return "General";
  };
  return settings.reduce((acc: GroupedSettings, setting: SystemSetting) => {
    const category = getSettingCategory(setting.key);
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {});
}

export default function SystemSettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editSetting, setEditSetting] = useState<SystemSetting | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canEdit =
    session?.user?.role === "Admin" ||
    session?.user?.modulePermissions?.includes("SYSTEM_SETTINGS_MANAGE");

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings/system-settings");
      if (!res.ok) throw new Error("Failed to fetch system settings");
      const data = await res.json();
      const arr: SystemSetting[] = Object.entries(data).map(([key, value]) => ({ key: key as import("@/lib/types").SystemSettingKey, value: value as string | null }));
      setSettings(arr);
    } catch (err) {
      setError((err as Error).message);
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleEdit = (setting: SystemSetting) => {
    setEditSetting(setting);
  };

  const handleSave = async (data: SystemSetting[]) => {
    setIsSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/settings/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save settings");
      }
      toast({ title: "Success", description: "System settings updated." });
      setEditSetting(null);
      setSuccess(true);
      fetchSettings();
    } catch (err) {
      setError((err as Error).message);
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading system settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">{error}</p>
          <button
            className="btn btn-primary"
            onClick={fetchSettings}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const grouped = groupSettings(settings);

  return (
    <div className="max-w-4xl mx-auto py-8 px-2 md:px-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure global, technical, and infrastructure-level settings for your application.
          </p>
        </div>
        {canEdit && (
          <SystemSettingsModal onSettingsUpdate={handleSave} />
        )}
      </div>
      {success && (
        <div className="mb-4 flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">
          <Info className="h-4 w-4" />
          <span>System settings updated successfully.</span>
        </div>
      )}
      {Object.entries(grouped).map(([category, categorySettings]) => (
        <div key={category} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold">{category} Settings</h2>
            <span className="text-xs text-muted-foreground">{CATEGORY_DESCRIPTIONS[category] || ""}</span>
          </div>
          <SystemSettingsTable
            settings={categorySettings}
            isLoading={false}
            onEdit={canEdit ? handleEdit : () => {}}
          />
        </div>
      ))}
      {editSetting && (
        <SystemSettingsForm
          open={!!editSetting}
          setting={editSetting}
          onClose={() => setEditSetting(null)}
          onSubmit={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
} 