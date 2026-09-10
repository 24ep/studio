import type React from 'react';
import type { EvaluateTabProps } from './EvaluateTabTypes';
import type {
    DrawerStyle,
    HeaderBackgroundType,
    LoginBackgroundType,
    LoginPageLayoutType,
} from './constants';

export interface BrandingTabProps extends EvaluateTabProps {
    canEdit: boolean;
    onSave: () => void;
    saving: boolean;
    drawerStyle: DrawerStyle;
    setDrawerStyle: (value: DrawerStyle) => void;
    handleLogoFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    logoPreviewUrl: string | null;
    removeSelectedLogo: (shouldRemoveSaved: boolean) => void;

    handleLoginPageLogoLightModeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    loginPageLogoLightModePreviewUrl: string | null;
    setLoginPageLogoLightModePreviewUrl: (url: string | null) => void;
    setSavedLoginPageLogoLightModeUrl: (url: string | null) => void;

    handleLoginPageLogoDarkModeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    loginPageLogoDarkModePreviewUrl: string | null;
    setLoginPageLogoDarkModePreviewUrl: (url: string | null) => void;
    setSavedLoginPageLogoDarkModeUrl: (url: string | null) => void;

    handleSidebarLogoCollapsedLightModeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    sidebarLogoCollapsedLightModePreviewUrl: string | null;
    setSidebarLogoCollapsedLightModePreviewUrl: (url: string | null) => void;
    setSavedSidebarLogoCollapsedLightModeUrl: (url: string | null) => void;

    handleSidebarLogoExpandedLightModeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    sidebarLogoExpandedLightModePreviewUrl: string | null;
    setSidebarLogoExpandedLightModePreviewUrl: (url: string | null) => void;
    setSavedSidebarLogoExpandedLightModeUrl: (url: string | null) => void;

    handleSidebarLogoCollapsedDarkModeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    sidebarLogoCollapsedDarkModePreviewUrl: string | null;
    setSidebarLogoCollapsedDarkModePreviewUrl: (url: string | null) => void;
    setSavedSidebarLogoCollapsedDarkModeUrl: (url: string | null) => void;

    handleSidebarLogoExpandedDarkModeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    sidebarLogoExpandedDarkModePreviewUrl: string | null;
    setSidebarLogoExpandedDarkModePreviewUrl: (url: string | null) => void;
    setSavedSidebarLogoExpandedDarkModeUrl: (url: string | null) => void;

    splashBackgroundColor: string;
    setSplashBackgroundColor: (color: string) => void;
    splashAnimationType: string;
    setSplashAnimationType: (type: string) => void;
    handleSplashLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    splashLogoPreviewUrl: string | null;
    removeSplashLogo: (shouldRemoveSaved: boolean) => void;
    loginPageLogoSize: number;
    setLoginPageLogoSize: (size: number) => void;

    headerBackgroundType: HeaderBackgroundType;
    setHeaderBackgroundType: (type: HeaderBackgroundType) => void;
    headerImagePreviewUrl: string | null;
    removeSelectedHeaderImage: (shouldRemoveSaved: boolean) => void;
    handleHeaderImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    headerBackgroundGradient: string | null;
    setHeaderBackgroundGradient: (gradient: string | null) => void;
    headerBackgroundColor: string;
    setHeaderBackgroundColor: (color: string) => void;
    headerTextColor: string;
    setHeaderTextColor: (color: string) => void;

    loginBackgroundType: LoginBackgroundType;
    setLoginBackgroundType: (value: LoginBackgroundType) => void;
    loginImagePreviewUrl: string | null;
    removeSelectedLoginImage: (shouldRemoveSaved: boolean) => void;
    handleLoginImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    loginBackgroundGradient: string | null;
    setLoginBackgroundGradient: (value: string) => void;
    loginBackgroundColor: string;
    setLoginBackgroundColor: (value: string) => void;
    loginBackgroundTypeMobile: LoginBackgroundType;
    setLoginBackgroundTypeMobile: (value: LoginBackgroundType) => void;
    loginImagePreviewUrlMobile: string | null;
    removeSelectedLoginImageMobile: (shouldRemoveSaved: boolean) => void;
    handleLoginImageFileChangeMobile: (event: React.ChangeEvent<HTMLInputElement>) => void;
    loginBackgroundGradientMobile: string | null;
    setLoginBackgroundGradientMobile: (value: string) => void;
    loginBackgroundColorMobile: string;
    setLoginBackgroundColorMobile: (value: string) => void;
    loginLayoutType: LoginPageLayoutType;
    setLoginLayoutType: (value: LoginPageLayoutType) => void;
}
