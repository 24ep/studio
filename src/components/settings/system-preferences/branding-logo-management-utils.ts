import type { ChangeEvent } from 'react';

export type BrandingLogoMode = 'light' | 'dark';
export type SidebarLogoKind = 'collapsed' | 'expanded';

export interface BrandingLogoUploadMetadata {
  alt: string;
  id: string;
  label: string;
}

export interface SidebarLogoModeMetadata {
  mode: BrandingLogoMode;
  modeLabel: string;
  collapsed: BrandingLogoUploadMetadata;
  expanded: BrandingLogoUploadMetadata;
}

export const PRIMARY_LOGO_UPLOAD = {
  id: 'app-logo-upload',
  alt: 'Primary logo preview',
  emptyText: 'Click to upload',
  recommendation: 'Recommended: 200x80px, max 500MB - PNG, JPG, or SVG format',
} as const;

export const LOGIN_LOGO_UPLOADS: BrandingLogoUploadMetadata[] = [
  {
    label: 'Light Mode',
    id: 'login-logo-light-upload',
    alt: 'Login light mode logo',
  },
  {
    label: 'Dark Mode',
    id: 'login-logo-dark-upload',
    alt: 'Login dark mode logo',
  },
];

export const SIDEBAR_LOGO_UPLOADS: SidebarLogoModeMetadata[] = [
  {
    mode: 'light',
    modeLabel: 'Light Mode',
    collapsed: {
      label: 'Collapsed',
      id: 'sidebar-collapsed-light-upload',
      alt: 'Sidebar collapsed light logo',
    },
    expanded: {
      label: 'Expanded',
      id: 'sidebar-expanded-light-upload',
      alt: 'Sidebar expanded light logo',
    },
  },
  {
    mode: 'dark',
    modeLabel: 'Dark Mode',
    collapsed: {
      label: 'Collapsed',
      id: 'sidebar-collapsed-dark-upload',
      alt: 'Sidebar collapsed dark logo',
    },
    expanded: {
      label: 'Expanded',
      id: 'sidebar-expanded-dark-upload',
      alt: 'Sidebar expanded dark logo',
    },
  },
];

export const LOGO_SIZE_INPUT = {
  min: 40,
  max: 300,
  step: 10,
} as const;

export function parseLoginPageLogoSize(value: string) {
  return parseInt(value, 10);
}

export function formatLoginPageLogoSize(size: number) {
  return `${size}px`;
}

type LogoPreviewSetter = (value: string | null) => void;
type LogoChangeHandler = (event: ChangeEvent<HTMLInputElement>) => void;

function clearPreviewAndSaved(
  setPreviewUrl: LogoPreviewSetter,
  setSavedUrl: LogoPreviewSetter
) {
  setPreviewUrl(null);
  setSavedUrl(null);
}

function buildLogoUploadConfig(
  metadata: BrandingLogoUploadMetadata,
  previewUrl: string | null,
  onChange: LogoChangeHandler,
  setPreviewUrl: LogoPreviewSetter,
  setSavedUrl: LogoPreviewSetter
): BrandingLogoUploadConfig {
  return {
    ...metadata,
    previewUrl,
    onChange,
    onRemove: () => clearPreviewAndSaved(setPreviewUrl, setSavedUrl),
  };
}

export interface BrandingLogoUploadConfig extends BrandingLogoUploadMetadata {
  onChange: LogoChangeHandler;
  onRemove: () => void;
  previewUrl: string | null;
}

export interface SidebarLogoUploadConfig {
  alt: string;
  id: string;
  onChange: LogoChangeHandler;
  onRemove: () => void;
  previewUrl: string | null;
}

export interface SidebarLogoUploadGroup {
  mode: BrandingLogoMode;
  modeLabel: string;
  collapsed: SidebarLogoUploadConfig;
  expanded: SidebarLogoUploadConfig;
}

export function buildLoginLogoUploads({
  darkPreviewUrl,
  lightPreviewUrl,
  onDarkChange,
  onLightChange,
  setDarkPreviewUrl,
  setLightPreviewUrl,
  setSavedDarkUrl,
  setSavedLightUrl,
}: {
  darkPreviewUrl: string | null;
  lightPreviewUrl: string | null;
  onDarkChange: LogoChangeHandler;
  onLightChange: LogoChangeHandler;
  setDarkPreviewUrl: LogoPreviewSetter;
  setLightPreviewUrl: LogoPreviewSetter;
  setSavedDarkUrl: LogoPreviewSetter;
  setSavedLightUrl: LogoPreviewSetter;
}): BrandingLogoUploadConfig[] {
  return [
    buildLogoUploadConfig(LOGIN_LOGO_UPLOADS[0], lightPreviewUrl, onLightChange, setLightPreviewUrl, setSavedLightUrl),
    buildLogoUploadConfig(LOGIN_LOGO_UPLOADS[1], darkPreviewUrl, onDarkChange, setDarkPreviewUrl, setSavedDarkUrl),
  ];
}

type LogoUploadArgs = [
  string | null,
  LogoChangeHandler,
  LogoPreviewSetter,
  LogoPreviewSetter,
];

function buildSidebarLogoUploadGroup(
  metadata: SidebarLogoModeMetadata,
  collapsedArgs: LogoUploadArgs,
  expandedArgs: LogoUploadArgs
): SidebarLogoUploadGroup {
  return {
    ...metadata,
    collapsed: buildLogoUploadConfig(metadata.collapsed, ...collapsedArgs),
    expanded: buildLogoUploadConfig(metadata.expanded, ...expandedArgs),
  };
}

export function buildSidebarLogoUploads({
  collapsedDarkPreviewUrl,
  collapsedLightPreviewUrl,
  expandedDarkPreviewUrl,
  expandedLightPreviewUrl,
  onCollapsedDarkChange,
  onCollapsedLightChange,
  onExpandedDarkChange,
  onExpandedLightChange,
  setCollapsedDarkPreviewUrl,
  setCollapsedLightPreviewUrl,
  setExpandedDarkPreviewUrl,
  setExpandedLightPreviewUrl,
  setSavedCollapsedDarkUrl,
  setSavedCollapsedLightUrl,
  setSavedExpandedDarkUrl,
  setSavedExpandedLightUrl,
}: {
  collapsedDarkPreviewUrl: string | null;
  collapsedLightPreviewUrl: string | null;
  expandedDarkPreviewUrl: string | null;
  expandedLightPreviewUrl: string | null;
  onCollapsedDarkChange: LogoChangeHandler;
  onCollapsedLightChange: LogoChangeHandler;
  onExpandedDarkChange: LogoChangeHandler;
  onExpandedLightChange: LogoChangeHandler;
  setCollapsedDarkPreviewUrl: LogoPreviewSetter;
  setCollapsedLightPreviewUrl: LogoPreviewSetter;
  setExpandedDarkPreviewUrl: LogoPreviewSetter;
  setExpandedLightPreviewUrl: LogoPreviewSetter;
  setSavedCollapsedDarkUrl: LogoPreviewSetter;
  setSavedCollapsedLightUrl: LogoPreviewSetter;
  setSavedExpandedDarkUrl: LogoPreviewSetter;
  setSavedExpandedLightUrl: LogoPreviewSetter;
}): SidebarLogoUploadGroup[] {
  return [
    buildSidebarLogoUploadGroup(
      SIDEBAR_LOGO_UPLOADS[0],
      [collapsedLightPreviewUrl, onCollapsedLightChange, setCollapsedLightPreviewUrl, setSavedCollapsedLightUrl],
      [expandedLightPreviewUrl, onExpandedLightChange, setExpandedLightPreviewUrl, setSavedExpandedLightUrl],
    ),
    buildSidebarLogoUploadGroup(
      SIDEBAR_LOGO_UPLOADS[1],
      [collapsedDarkPreviewUrl, onCollapsedDarkChange, setCollapsedDarkPreviewUrl, setSavedCollapsedDarkUrl],
      [expandedDarkPreviewUrl, onExpandedDarkChange, setExpandedDarkPreviewUrl, setSavedExpandedDarkUrl],
    ),
  ];
}
