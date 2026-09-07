"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

import { useClickProtection } from "@/hooks/use-click-protection";
import { useToast } from "@/hooks/use-toast";
import { readJsonOrFallback } from "@/lib/response-json";
import {
  buildBasicSystemPreferencesSavePayload,
  buildBasicSystemPreferencesState,
  DEFAULT_BASIC_THEME,
  DEFAULT_SIDEBAR_LOGO_SIZE,
  fetchWithTimeout,
  readBasicSystemPreferencesSaveError,
  SYSTEM_SETTINGS_URL,
  uploadPreferenceImage,
} from "./system-preferences/basic-form-utils";
import {
  DEFAULT_APP_NAME,
  type ThemePreference,
} from "./system-preferences/constants";
import { canEditSystemPreferences } from "./system-preferences/utils";

interface UseSystemPreferencesFormOptions {
  onSave?: () => void;
}

export function useSystemPreferencesForm({ onSave }: UseSystemPreferencesFormOptions = {}) {
  const { data: session, status: sessionStatus } = useSession();
  const { success: showSuccess, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [appFaviconUrl, setAppFaviconUrl] = useState<string | null>(null);
  const [themePreference, setThemePreference] = useState<ThemePreference>(DEFAULT_BASIC_THEME);
  const [showLogoOnly, setShowLogoOnly] = useState(false);
  const [sidebarLogoSize, setSidebarLogoSize] = useState(DEFAULT_SIDEBAR_LOGO_SIZE);

  const { isActioning, handleProtectedAsyncClick } = useClickProtection({
    actionName: "save settings",
    debounceMs: 200,
    timeoutMs: 500,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !isClient) return;

    const loadSettings = async () => {
      try {
        setIsLoading(true);

        const response = await fetchWithTimeout(SYSTEM_SETTINGS_URL, {}, 10000);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const settings = buildBasicSystemPreferencesState(await readJsonOrFallback<unknown>(response, {}));
        setAppName(settings.appName);
        setAppLogoUrl(settings.appLogoUrl);
        setAppFaviconUrl(settings.appFaviconUrl);
        setThemePreference(settings.themePreference);
        setShowLogoOnly(settings.showLogoOnly);
        setSidebarLogoSize(settings.sidebarLogoSize);
      } catch (error) {
        console.error("Error loading settings:", error);
        showError(error instanceof Error && error.name === "AbortError"
          ? "Request timed out. Please try again."
          : "Failed to load system settings");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isClient, sessionStatus, showError]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const settingsToSave = buildBasicSystemPreferencesSavePayload({
        appFaviconUrl,
        appLogoUrl,
        appName,
        showLogoOnly,
        sidebarLogoSize,
        themePreference,
      });

      const response = await fetchWithTimeout(
        SYSTEM_SETTINGS_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsToSave),
        },
        5000
      );

      if (!response.ok) {
        throw new Error(await readBasicSystemPreferencesSaveError(response));
      }

      showSuccess("System settings saved successfully");
      window.dispatchEvent(new CustomEvent("appConfigChanged", {
        detail: {
          appName,
          faviconDataUrl: appFaviconUrl,
          showLogoOnly,
          sidebarLogoSize,
          themePreference,
        },
      }));
      window.dispatchEvent(new CustomEvent("faviconUpdated", {
        detail: {
          faviconDataUrl: appFaviconUrl,
        },
      }));
      window.dispatchEvent(new CustomEvent("globalSettingsChanged"));
      onSave?.();
    } catch (error) {
      console.error("Error saving settings:", error);
      showError(error instanceof Error && error.name === "AbortError"
        ? "Request timed out. Please try again."
        : "Failed to save system settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    upload: (file: File) => Promise<string>,
    setUrl: (url: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUrl(await upload(file));
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      event.target.value = "";
    }
  };

  const isLoadingView = sessionStatus === "loading" || !isClient || isLoading;
  const loadingMessage = sessionStatus === "loading"
    ? "Loading session..."
    : !isClient
      ? "Initializing..."
      : "Loading settings...";

  return {
    appFaviconUrl,
    appLogoUrl,
    appName,
    canEdit: canEditSystemPreferences(session?.user),
    handleFaviconUpload: (event: ChangeEvent<HTMLInputElement>) => handleImageUpload(
      event,
      file => uploadPreferenceImage(file, "Uploading favicon...", "Favicon uploaded successfully"),
      setAppFaviconUrl
    ),
    handleLogoUpload: (event: ChangeEvent<HTMLInputElement>) => handleImageUpload(
      event,
      file => uploadPreferenceImage(file, "Uploading logo...", "Logo uploaded successfully", "app-logo"),
      setAppLogoUrl
    ),
    handleProtectedSave: () => handleProtectedAsyncClick(handleSave),
    isActioning,
    isLoadingView,
    isSaving,
    loadingMessage,
    sessionStatus,
    setAppFaviconUrl,
    setAppLogoUrl,
    setAppName,
    setShowLogoOnly,
    setSidebarLogoSize,
    setThemePreference,
    showLogoOnly,
    sidebarLogoSize,
    themePreference,
  };
}
