import type { AppLayoutContextualLogos } from "./app-layout-settings";

export interface SidebarHeaderContentProps {
  currentAppName: string;
  appLogoUrl: string | null;
  isClient: boolean;
  isLogoLoading: boolean;
  showLogoOnly?: boolean;
  sidebarLogoSize?: number;
  collapsedSidebarLogoSize?: number;
  contextualLogos?: Partial<AppLayoutContextualLogos>;
}

export interface SidebarHeaderUser {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatarUrl: string | null;
  image: string | null;
  personalColor: string | null;
}
