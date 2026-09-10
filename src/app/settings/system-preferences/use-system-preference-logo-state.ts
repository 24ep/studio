import { useMemo, useState } from "react";

export function useSystemPreferenceLogoState() {
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);

  const [loginPageLogoLightModePreviewUrl, setLoginPageLogoLightModePreviewUrl] = useState<string | null>(null);
  const [savedLoginPageLogoLightModeUrl, setSavedLoginPageLogoLightModeUrl] = useState<string | null>(null);
  const [loginPageLogoDarkModePreviewUrl, setLoginPageLogoDarkModePreviewUrl] = useState<string | null>(null);
  const [savedLoginPageLogoDarkModeUrl, setSavedLoginPageLogoDarkModeUrl] = useState<string | null>(null);

  const [sidebarLogoCollapsedLightModePreviewUrl, setSidebarLogoCollapsedLightModePreviewUrl] = useState<string | null>(null);
  const [savedSidebarLogoCollapsedLightModeUrl, setSavedSidebarLogoCollapsedLightModeUrl] = useState<string | null>(null);
  const [sidebarLogoExpandedLightModePreviewUrl, setSidebarLogoExpandedLightModePreviewUrl] = useState<string | null>(null);
  const [savedSidebarLogoExpandedLightModeUrl, setSavedSidebarLogoExpandedLightModeUrl] = useState<string | null>(null);

  const [sidebarLogoCollapsedDarkModePreviewUrl, setSidebarLogoCollapsedDarkModePreviewUrl] = useState<string | null>(null);
  const [savedSidebarLogoCollapsedDarkModeUrl, setSavedSidebarLogoCollapsedDarkModeUrl] = useState<string | null>(null);
  const [sidebarLogoExpandedDarkModePreviewUrl, setSidebarLogoExpandedDarkModePreviewUrl] = useState<string | null>(null);
  const [savedSidebarLogoExpandedDarkModeUrl, setSavedSidebarLogoExpandedDarkModeUrl] = useState<string | null>(null);

  const [evaluatePlatformLogoPreviewUrl, setEvaluatePlatformLogoPreviewUrl] = useState<string | null>(null);
  const [savedEvaluatePlatformLogoUrl, setSavedEvaluatePlatformLogoUrl] = useState<string | null>(null);
  const [evaluateReportLogoPreviewUrl, setEvaluateReportLogoPreviewUrl] = useState<string | null>(null);
  const [savedEvaluateReportLogoUrl, setSavedEvaluateReportLogoUrl] = useState<string | null>(null);
  const loadedPreferenceStateSetters = useMemo(() => ({
    setSavedLogoUrl,
    setLogoPreviewUrl,
    setSavedLoginPageLogoLightModeUrl,
    setLoginPageLogoLightModePreviewUrl,
    setSavedLoginPageLogoDarkModeUrl,
    setLoginPageLogoDarkModePreviewUrl,
    setSavedSidebarLogoCollapsedLightModeUrl,
    setSidebarLogoCollapsedLightModePreviewUrl,
    setSavedSidebarLogoExpandedLightModeUrl,
    setSidebarLogoExpandedLightModePreviewUrl,
    setSavedSidebarLogoCollapsedDarkModeUrl,
    setSidebarLogoCollapsedDarkModePreviewUrl,
    setSavedSidebarLogoExpandedDarkModeUrl,
    setSidebarLogoExpandedDarkModePreviewUrl,
    setSavedEvaluatePlatformLogoUrl,
    setEvaluatePlatformLogoPreviewUrl,
    setSavedEvaluateReportLogoUrl,
    setEvaluateReportLogoPreviewUrl,
  }), []);

  return {
    selectedLogoFile,
    setSelectedLogoFile,
    logoPreviewUrl,
    setLogoPreviewUrl,
    savedLogoUrl,
    setSavedLogoUrl,
    loginPageLogoLightModePreviewUrl,
    setLoginPageLogoLightModePreviewUrl,
    savedLoginPageLogoLightModeUrl,
    setSavedLoginPageLogoLightModeUrl,
    loginPageLogoDarkModePreviewUrl,
    setLoginPageLogoDarkModePreviewUrl,
    savedLoginPageLogoDarkModeUrl,
    setSavedLoginPageLogoDarkModeUrl,
    sidebarLogoCollapsedLightModePreviewUrl,
    setSidebarLogoCollapsedLightModePreviewUrl,
    savedSidebarLogoCollapsedLightModeUrl,
    setSavedSidebarLogoCollapsedLightModeUrl,
    sidebarLogoExpandedLightModePreviewUrl,
    setSidebarLogoExpandedLightModePreviewUrl,
    savedSidebarLogoExpandedLightModeUrl,
    setSavedSidebarLogoExpandedLightModeUrl,
    sidebarLogoCollapsedDarkModePreviewUrl,
    setSidebarLogoCollapsedDarkModePreviewUrl,
    savedSidebarLogoCollapsedDarkModeUrl,
    setSavedSidebarLogoCollapsedDarkModeUrl,
    sidebarLogoExpandedDarkModePreviewUrl,
    setSidebarLogoExpandedDarkModePreviewUrl,
    savedSidebarLogoExpandedDarkModeUrl,
    setSavedSidebarLogoExpandedDarkModeUrl,
    evaluatePlatformLogoPreviewUrl,
    setEvaluatePlatformLogoPreviewUrl,
    savedEvaluatePlatformLogoUrl,
    setSavedEvaluatePlatformLogoUrl,
    evaluateReportLogoPreviewUrl,
    setEvaluateReportLogoPreviewUrl,
    savedEvaluateReportLogoUrl,
    setSavedEvaluateReportLogoUrl,
    loadedPreferenceStateSetters,
  };
}
