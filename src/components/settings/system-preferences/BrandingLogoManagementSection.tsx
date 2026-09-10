import { Separator } from "@/components/ui/separator";
import type { BrandingTabProps } from "./BrandingTabTypes";
import {
  ContextualLogoRows,
  LoginLogoSizeRow,
  PrimaryLogoRow,
} from "./BrandingLogoManagementSectionParts";
import {
  buildLoginLogoUploads,
  buildSidebarLogoUploads,
} from "./branding-logo-management-utils";

export function LogoManagementSection({
  canEdit,
  handleLogoFileChange,
  handleLoginPageLogoDarkModeChange,
  handleLoginPageLogoLightModeChange,
  handleSidebarLogoCollapsedDarkModeChange,
  handleSidebarLogoCollapsedLightModeChange,
  handleSidebarLogoExpandedDarkModeChange,
  handleSidebarLogoExpandedLightModeChange,
  loginPageLogoDarkModePreviewUrl,
  loginPageLogoLightModePreviewUrl,
  loginPageLogoSize,
  logoPreviewUrl,
  removeSelectedLogo,
  setLoginPageLogoDarkModePreviewUrl,
  setLoginPageLogoLightModePreviewUrl,
  setLoginPageLogoSize,
  setSavedLoginPageLogoDarkModeUrl,
  setSavedLoginPageLogoLightModeUrl,
  setSavedSidebarLogoCollapsedDarkModeUrl,
  setSavedSidebarLogoCollapsedLightModeUrl,
  setSavedSidebarLogoExpandedDarkModeUrl,
  setSavedSidebarLogoExpandedLightModeUrl,
  setSidebarLogoCollapsedDarkModePreviewUrl,
  setSidebarLogoCollapsedLightModePreviewUrl,
  setSidebarLogoExpandedDarkModePreviewUrl,
  setSidebarLogoExpandedLightModePreviewUrl,
  sidebarLogoCollapsedDarkModePreviewUrl,
  sidebarLogoCollapsedLightModePreviewUrl,
  sidebarLogoExpandedDarkModePreviewUrl,
  sidebarLogoExpandedLightModePreviewUrl,
}: BrandingTabProps) {
  const loginLogoUploads = buildLoginLogoUploads({
    darkPreviewUrl: loginPageLogoDarkModePreviewUrl,
    lightPreviewUrl: loginPageLogoLightModePreviewUrl,
    onDarkChange: handleLoginPageLogoDarkModeChange,
    onLightChange: handleLoginPageLogoLightModeChange,
    setDarkPreviewUrl: setLoginPageLogoDarkModePreviewUrl,
    setLightPreviewUrl: setLoginPageLogoLightModePreviewUrl,
    setSavedDarkUrl: setSavedLoginPageLogoDarkModeUrl,
    setSavedLightUrl: setSavedLoginPageLogoLightModeUrl,
  });
  const sidebarLogoUploads = buildSidebarLogoUploads({
    collapsedDarkPreviewUrl: sidebarLogoCollapsedDarkModePreviewUrl,
    collapsedLightPreviewUrl: sidebarLogoCollapsedLightModePreviewUrl,
    expandedDarkPreviewUrl: sidebarLogoExpandedDarkModePreviewUrl,
    expandedLightPreviewUrl: sidebarLogoExpandedLightModePreviewUrl,
    onCollapsedDarkChange: handleSidebarLogoCollapsedDarkModeChange,
    onCollapsedLightChange: handleSidebarLogoCollapsedLightModeChange,
    onExpandedDarkChange: handleSidebarLogoExpandedDarkModeChange,
    onExpandedLightChange: handleSidebarLogoExpandedLightModeChange,
    setCollapsedDarkPreviewUrl: setSidebarLogoCollapsedDarkModePreviewUrl,
    setCollapsedLightPreviewUrl: setSidebarLogoCollapsedLightModePreviewUrl,
    setExpandedDarkPreviewUrl: setSidebarLogoExpandedDarkModePreviewUrl,
    setExpandedLightPreviewUrl: setSidebarLogoExpandedLightModePreviewUrl,
    setSavedCollapsedDarkUrl: setSavedSidebarLogoCollapsedDarkModeUrl,
    setSavedCollapsedLightUrl: setSavedSidebarLogoCollapsedLightModeUrl,
    setSavedExpandedDarkUrl: setSavedSidebarLogoExpandedDarkModeUrl,
    setSavedExpandedLightUrl: setSavedSidebarLogoExpandedLightModeUrl,
  });

  return (
    <>
      <PrimaryLogoRow
        canEdit={canEdit}
        logoPreviewUrl={logoPreviewUrl}
        onChange={handleLogoFileChange}
        onRemove={() => removeSelectedLogo(true)}
      />

      <Separator />

      <ContextualLogoRows
        canEdit={canEdit}
        loginLogoUploads={loginLogoUploads}
        sidebarLogoUploads={sidebarLogoUploads}
      />

      <LoginLogoSizeRow
        canEdit={canEdit}
        loginPageLogoSize={loginPageLogoSize}
        onLoginPageLogoSizeChange={setLoginPageLogoSize}
      />
    </>
  );
}
