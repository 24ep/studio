
"use client";
import { useState, useEffect, type ChangeEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, ImageUp, Trash2, Loader2, XCircle, PenSquare, ServerCrash, ShieldAlert, Settings2, Wallpaper, Droplets, Type, Sidebar as SidebarIcon, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { SystemSetting, LoginPageBackgroundType, SystemSettingKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

type ThemePreference = "light" | "dark" | "system";
const DEFAULT_APP_NAME = "CandiTrack";

const DEFAULT_PRIMARY_GRADIENT_START = "179 67% 66%";
const DEFAULT_PRIMARY_GRADIENT_END = "238 74% 61%";

const DEFAULT_LOGIN_BG_TYPE: LoginPageBackgroundType = "default";
const DEFAULT_LOGIN_BG_COLOR1_HEX = "#F0F4F7"; 
const DEFAULT_LOGIN_BG_COLOR2_HEX = "#3F51B5"; 

// Default Sidebar colors (HSL strings) - using the NEW primary gradient defaults
const DEFAULT_SIDEBAR_COLORS_BASE: Record<SystemSettingKey, string> = {
  sidebarBgStartL: "220 25% 97%", sidebarBgEndL: "220 20% 94%", sidebarTextL: "220 25% 30%",
  sidebarActiveBgStartL: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndL: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextL: "0 0% 100%",      
  sidebarHoverBgL: "220 10% 92%", sidebarHoverTextL: "220 25% 25%", sidebarBorderL: "220 15% 85%",
  sidebarBgStartD: "220 15% 12%", sidebarBgEndD: "220 15% 9%", sidebarTextD: "210 30% 85%",
  sidebarActiveBgStartD: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndD: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextD: "0 0% 100%",      
  sidebarHoverBgD: "220 15% 20%", sidebarHoverTextD: "210 30% 90%", sidebarBorderD: "220 15% 18%",
  appName: DEFAULT_APP_NAME, appLogoDataUrl: '', appThemePreference: 'system', 
  primaryGradientStart: DEFAULT_PRIMARY_GRADIENT_START, primaryGradientEnd: DEFAULT_PRIMARY_GRADIENT_END,
  smtpHost: '', smtpPort: '', smtpUser: '', smtpSecure: 'true', smtpFromEmail: '',
  n8nResumeWebhookUrl: '', n8nGenericPdfWebhookUrl: '', geminiApiKey: '',
  loginPageBackgroundType: 'default', loginPageBackgroundImageUrl: '', 
  loginPageBackgroundColor1: '#F0F4F7', loginPageBackgroundColor2: '#3F51B5'
};


const PREFERENCE_SECTIONS = [
  { id: 'appName', label: 'App Name', icon: Type, description: "Set the global name for the application." },
  { id: 'logo', label: 'Application Logo', icon: ImageUp, description: "Upload or manage the application's logo." },
  { id: 'theme', label: 'Theme Preference', icon: Palette, description: "Choose your preferred application theme." },
  { id: 'primaryColors', label: 'Primary Color Theme', icon: Droplets, description: "Customize the primary gradient colors." },
  { id: 'loginAppearance', label: 'Login Page Appearance', icon: Wallpaper, description: "Customize the background of the login page." },
  { id: 'sidebarAppearance', label: 'Sidebar Colors', icon: SidebarIcon, description: "Customize the sidebar appearance for light and dark themes." },
];

interface SidebarColors {
  sidebarBgStartL: string; sidebarBgEndL: string; sidebarTextL: string;
  sidebarActiveBgStartL: string; sidebarActiveBgEndL: string; sidebarActiveTextL: string;
  sidebarHoverBgL: string; sidebarHoverTextL: string; sidebarBorderL: string;
  sidebarBgStartD: string; sidebarBgEndD: string; sidebarTextD: string;
  sidebarActiveBgStartD: string; sidebarActiveBgEndD: string; 
  sidebarActiveTextD: string;
  sidebarHoverBgD: string; sidebarHoverTextD: string; sidebarBorderD: string;
}

// Helper to create a fully typed initial state for SidebarColors
const createInitialSidebarColors = (): SidebarColors => ({
  sidebarBgStartL: DEFAULT_SIDEBAR_COLORS_BASE.sidebarBgStartL,
  sidebarBgEndL: DEFAULT_SIDEBAR_COLORS_BASE.sidebarBgEndL,
  sidebarTextL: DEFAULT_SIDEBAR_COLORS_BASE.sidebarTextL,
  sidebarActiveBgStartL: DEFAULT_SIDEBAR_COLORS_BASE.sidebarActiveBgStartL,
  sidebarActiveBgEndL: DEFAULT_SIDEBAR_COLORS_BASE.sidebarActiveBgEndL,
  sidebarActiveTextL: DEFAULT_SIDEBAR_COLORS_BASE.sidebarActiveTextL,
  sidebarHoverBgL: DEFAULT_SIDEBAR_COLORS_BASE.sidebarHoverBgL,
  sidebarHoverTextL: DEFAULT_SIDEBAR_COLORS_BASE.sidebarHoverTextL,
  sidebarBorderL: DEFAULT_SIDEBAR_COLORS_BASE.sidebarBorderL,
  sidebarBgStartD: DEFAULT_SIDEBAR_COLORS_BASE.sidebarBgStartD,
  sidebarBgEndD: DEFAULT_SIDEBAR_COLORS_BASE.sidebarBgEndD,
  sidebarTextD: DEFAULT_SIDEBAR_COLORS_BASE.sidebarTextD,
  sidebarActiveBgStartD: DEFAULT_SIDEBAR_COLORS_BASE.sidebarActiveBgStartD,
  sidebarActiveBgEndD: DEFAULT_SIDEBAR_COLORS_BASE.sidebarActiveBgEndD,
  sidebarActiveTextD: DEFAULT_SIDEBAR_COLORS_BASE.sidebarActiveTextD,
  sidebarHoverBgD: DEFAULT_SIDEBAR_COLORS_BASE.sidebarHoverBgD,
  sidebarHoverTextD: DEFAULT_SIDEBAR_COLORS_BASE.sidebarHoverTextD,
  sidebarBorderD: DEFAULT_SIDEBAR_COLORS_BASE.sidebarBorderD,
});


function parseHslString(hslString: string): { h: number; s: number; l: number } | null {
  const match = hslString?.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!match) return null;
  return {
    h: parseInt(match[1], 10),
    s: parseInt(match[2], 10) / 100,
    l: parseInt(match[3], 10) / 100,
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToHslString(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.startsWith('#')) hex = hex.substring(1);
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else { return "0 0% 0%"; } 

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  return `${h} ${s}% ${lPercent}%`;
}

function convertHslStringToHex(hslString: string | null | undefined): string {
    if (!hslString) return '#000000';
    const hslObj = parseHslString(hslString);
    if (!hslObj) return '#000000';
    return hslToHex(hslObj.h, hslObj.s, hslObj.l);
}


export default function PreferencesSettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [appName, setAppName] = useState<string>(DEFAULT_APP_NAME);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoDataUrl, setSavedLogoDataUrl] = useState<string | null>(null);

  const [primaryGradientStart, setPrimaryGradientStart] = useState<string>(DEFAULT_PRIMARY_GRADIENT_START);
  const [primaryGradientEnd, setPrimaryGradientEnd] = useState<string>(DEFAULT_PRIMARY_GRADIENT_END);

  const [loginBgType, setLoginBgType] = useState<LoginPageBackgroundType>(DEFAULT_LOGIN_BG_TYPE);
  const [selectedLoginBgFile, setSelectedLoginBgFile] = useState<File | null>(null);
  const [loginBgImagePreviewUrl, setLoginBgImagePreviewUrl] = useState<string | null>(null);
  const [savedLoginBgImageUrl, setSavedLoginBgImageUrl] = useState<string | null>(null);
  const [loginBgColor1, setLoginBgColor1] = useState<string>(DEFAULT_LOGIN_BG_COLOR1_HEX);
  const [loginBgColor2, setLoginBgColor2] = useState<string>(DEFAULT_LOGIN_BG_COLOR2_HEX);

  const [sidebarColors, setSidebarColors] = useState<SidebarColors>(createInitialSidebarColors());
  
  const [activeSection, setActiveSection] = useState<string>(PREFERENCE_SECTIONS[0].id);


  const handleSidebarColorChange = (key: keyof SidebarColors, value: string) => {
    setSidebarColors(prev => ({ ...prev, [key]: value }));
  };

  const fetchSystemSettings = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/system-settings');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load system settings' }));
        throw new Error(errorData.message);
      }
      const settings: SystemSetting[] = await response.json();
      const settingsMap = new Map(settings.map(s => [s.key, s.value]));

      setAppName(settingsMap.get('appName') || DEFAULT_APP_NAME);
      setThemePreference((settingsMap.get('appThemePreference') as ThemePreference) || 'system');
      const logoUrl = settingsMap.get('appLogoDataUrl') || null;
      setSavedLogoDataUrl(logoUrl);
      setLogoPreviewUrl(logoUrl);
      setPrimaryGradientStart(settingsMap.get('primaryGradientStart') || DEFAULT_PRIMARY_GRADIENT_START);
      setPrimaryGradientEnd(settingsMap.get('primaryGradientEnd') || DEFAULT_PRIMARY_GRADIENT_END);
      setLoginBgType((settingsMap.get('loginPageBackgroundType') as LoginPageBackgroundType) || DEFAULT_LOGIN_BG_TYPE);
      const loginImgUrl = settingsMap.get('loginPageBackgroundImageUrl') || null;
      setSavedLoginBgImageUrl(loginImgUrl);
      setLoginBgImagePreviewUrl(loginImgUrl);
      setLoginBgColor1(settingsMap.get('loginPageBackgroundColor1') || DEFAULT_LOGIN_BG_COLOR1_HEX);
      setLoginBgColor2(settingsMap.get('loginPageBackgroundColor2') || DEFAULT_LOGIN_BG_COLOR2_HEX);
      
      const newSidebarColorsData: SidebarColors = { ...createInitialSidebarColors() };
      (Object.keys(newSidebarColorsData) as Array<keyof SidebarColors>).forEach(key => {
        const dbValue = settingsMap.get(key as SystemSettingKey);
        if (dbValue !== null && dbValue !== undefined) {
          newSidebarColorsData[key] = dbValue;
        }
      });
      setSidebarColors(newSidebarColorsData);

    } catch (error) {
      console.error("Error fetching system settings:", error);
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('SYSTEM_SETTINGS_MANAGE')) {
        setFetchError("You do not have permission to manage application preferences.");
        setIsLoading(false);
      } else {
        fetchSystemSettings();
      }
    }
  }, [sessionStatus, session, pathname, signIn, fetchSystemSettings]);

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>, type: 'appLogo' | 'loginBg') => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 500 * 1024) {
            toast({ title: "Image Too Large", description: "Please select an image smaller than 500KB.", variant: "destructive" });
            if (type === 'appLogo') { setSelectedLogoFile(null); setLogoPreviewUrl(savedLogoDataUrl); }
            else { setSelectedLoginBgFile(null); setLoginBgImagePreviewUrl(savedLoginBgImageUrl); }
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === 'appLogo') {
            setSelectedLogoFile(file);
            setLogoPreviewUrl(reader.result as string);
          } else {
            setSelectedLoginBgFile(file);
            setLoginBgImagePreviewUrl(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please select an image file (e.g., PNG, JPG, SVG, WEBP).", variant: "destructive" });
      }
    }
  };

  const removeSelectedImage = async (type: 'appLogo' | 'loginBg', clearSaved: boolean = false) => {
    const fileInputId = type === 'appLogo' ? 'app-logo-upload' : 'login-bg-image-upload';
    const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
    if (fileInput) fileInput.value = '';

    if (type === 'appLogo') {
      setSelectedLogoFile(null);
      if (clearSaved) {
        await saveSpecificSetting('appLogoDataUrl', null);
        setSavedLogoDataUrl(null);
        setLogoPreviewUrl(null);
        toast({ title: "App Logo Cleared", description: "The application logo has been reset." });
        window.dispatchEvent(new CustomEvent('appConfigChanged', { detail: { logoUrl: null } }));
      } else {
        setLogoPreviewUrl(savedLogoDataUrl);
      }
    } else {
      setSelectedLoginBgFile(null);
      if (clearSaved) {
        await saveSpecificSetting('loginPageBackgroundImageUrl', null);
        setSavedLoginBgImageUrl(null);
        setLoginBgImagePreviewUrl(null);
        toast({ title: "Login Background Image Cleared", description: "The login page background image has been reset." });
      } else {
        setLoginBgImagePreviewUrl(savedLoginBgImageUrl);
      }
    }
  };

  const saveSpecificSetting = async (key: SystemSettingKey, value: string | null) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ key, value }]),
      });
      if (!response.ok) throw new Error(`Failed to save ${key} on server.`);
    } catch (error) {
      toast({ title: `Error Saving ${key}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!isClient) return;
    setIsSaving(true);
    const settingsToUpdate: SystemSetting[] = [
      { key: 'appName', value: appName || DEFAULT_APP_NAME },
      { key: 'appThemePreference', value: themePreference },
      { key: 'primaryGradientStart', value: primaryGradientStart },
      { key: 'primaryGradientEnd', value: primaryGradientEnd },
      { key: 'loginPageBackgroundType', value: loginBgType },
      { key: 'loginPageBackgroundColor1', value: loginBgColor1 },
      { key: 'loginPageBackgroundColor2', value: loginBgColor2 },
      // Serialize sidebarColors correctly
      ...(Object.keys(sidebarColors) as Array<keyof SidebarColors>).map(key => ({
        key: key as SystemSettingKey, // Cast here, ensure SidebarColors keys are subset of SystemSettingKey
        value: sidebarColors[key]
      })),
    ];
    if (selectedLogoFile && logoPreviewUrl) {
      settingsToUpdate.push({ key: 'appLogoDataUrl', value: logoPreviewUrl });
    }
    if (selectedLoginBgFile && loginBgImagePreviewUrl && loginBgType === 'image') {
      settingsToUpdate.push({ key: 'loginPageBackgroundImageUrl', value: loginBgImagePreviewUrl });
    } else if (loginBgType !== 'image' && savedLoginBgImageUrl !== null) {
      settingsToUpdate.push({ key: 'loginPageBackgroundImageUrl', value: null });
    }

    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToUpdate),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save preferences to server' }));
        throw new Error(errorData.message);
      }
      const updatedSettingsList: SystemSetting[] = await response.json();
      const updatedSettingsMap = new Map(updatedSettingsList.map(s => [s.key, s.value]));
      
      // Re-populate states from the server response to ensure consistency
      setAppName(updatedSettingsMap.get('appName') || DEFAULT_APP_NAME);
      setThemePreference((updatedSettingsMap.get('appThemePreference') as ThemePreference) || 'system');
      const updatedLogoUrl = updatedSettingsMap.get('appLogoDataUrl') || null;
      setSavedLogoDataUrl(updatedLogoUrl);
      setLogoPreviewUrl(updatedLogoUrl);
      setPrimaryGradientStart(updatedSettingsMap.get('primaryGradientStart') || DEFAULT_PRIMARY_GRADIENT_START);
      setPrimaryGradientEnd(updatedSettingsMap.get('primaryGradientEnd') || DEFAULT_PRIMARY_GRADIENT_END);
      
      const updatedLoginBgTypeVal = (updatedSettingsMap.get('loginPageBackgroundType') as LoginPageBackgroundType) || DEFAULT_LOGIN_BG_TYPE;
      const updatedLoginBgImageVal = updatedSettingsMap.get('loginPageBackgroundImageUrl') || null;
      setLoginBgType(updatedLoginBgTypeVal);
      setSavedLoginBgImageUrl(updatedLoginBgImageVal);
      setLoginBgImagePreviewUrl(updatedLoginBgTypeVal === 'image' ? updatedLoginBgImageVal : null);
      setLoginBgColor1(updatedSettingsMap.get('loginPageBackgroundColor1') || DEFAULT_LOGIN_BG_COLOR1_HEX);
      setLoginBgColor2(updatedSettingsMap.get('loginPageBackgroundColor2') || DEFAULT_LOGIN_BG_COLOR2_HEX);
      
      const newSidebarColorsData: SidebarColors = { ...createInitialSidebarColors() };
      (Object.keys(newSidebarColorsData) as Array<keyof SidebarColors>).forEach(key => {
        const dbValue = updatedSettingsMap.get(key as SystemSettingKey);
        // Ensure we only assign if dbValue is string, otherwise default from createInitialSidebarColors is used
        if (typeof dbValue === 'string') {
          newSidebarColorsData[key] = dbValue;
        }
      });
      setSidebarColors(newSidebarColorsData);

      toast({ title: 'Preferences Saved', description: 'Your application preferences have been saved to the server.', variant: 'success' });
      window.dispatchEvent(new CustomEvent('appConfigChanged', {
        detail: {
          appName: updatedSettingsMap.get('appName') || DEFAULT_APP_NAME,
          logoUrl: updatedLogoUrl,
          primaryGradientStart: updatedSettingsMap.get('primaryGradientStart') || DEFAULT_PRIMARY_GRADIENT_START,
          primaryGradientEnd: updatedSettingsMap.get('primaryGradientEnd') || DEFAULT_PRIMARY_GRADIENT_END,
        }
      }));
    } catch (error) {
      console.error("Error saving preferences to server:", error);
      toast({ title: "Error Saving Preferences", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setSelectedLogoFile(null);
      setSelectedLoginBgFile(null);
    }
  };

  const resetPrimaryColors = () => {
    setPrimaryGradientStart(DEFAULT_PRIMARY_GRADIENT_START);
    setPrimaryGradientEnd(DEFAULT_PRIMARY_GRADIENT_END);
    toast({ title: "Primary Colors Reset", description: "Primary colors reset to default. Click 'Save All' to persist." });
  };

  const resetLoginBackground = () => {
    setLoginBgType(DEFAULT_LOGIN_BG_TYPE);
    setLoginBgColor1(DEFAULT_LOGIN_BG_COLOR1_HEX);
    setLoginBgColor2(DEFAULT_LOGIN_BG_COLOR2_HEX);
    setSelectedLoginBgFile(null);
    setLoginBgImagePreviewUrl(null); 
    toast({ title: "Login Background Reset", description: "Login page background reset to default. Click 'Save All' to persist." });
  };

  const resetSidebarColors = (themeType: 'Light' | 'Dark') => {
    const defaultColorsForTheme = createInitialSidebarColors();
    const suffix = themeType === 'Light' ? 'L' : 'D';
    setSidebarColors(prev => ({
      ...prev,
      [`sidebarBgStart${suffix}`]: defaultColorsForTheme[`sidebarBgStart${suffix}` as keyof SidebarColors],
      [`sidebarBgEnd${suffix}`]: defaultColorsForTheme[`sidebarBgEnd${suffix}` as keyof SidebarColors],
      [`sidebarText${suffix}`]: defaultColorsForTheme[`sidebarText${suffix}` as keyof SidebarColors],
      [`sidebarActiveBgStart${suffix}`]: defaultColorsForTheme[`sidebarActiveBgStart${suffix}` as keyof SidebarColors],
      [`sidebarActiveBgEnd${suffix}`]: defaultColorsForTheme[`sidebarActiveBgEnd${suffix}` as keyof SidebarColors],
      [`sidebarActiveText${suffix}`]: defaultColorsForTheme[`sidebarActiveText${suffix}` as keyof SidebarColors],
      [`sidebarHoverBg${suffix}`]: defaultColorsForTheme[`sidebarHoverBg${suffix}` as keyof SidebarColors],
      [`sidebarHoverText${suffix}`]: defaultColorsForTheme[`sidebarHoverText${suffix}` as keyof SidebarColors],
      [`sidebarBorder${suffix}`]: defaultColorsForTheme[`sidebarBorder${suffix}` as keyof SidebarColors],
    }));
    toast({ title: `${themeType} Sidebar Colors Reset`, description: `${themeType} sidebar colors reset to default. Click 'Save All' to persist.` });
  };


  if (sessionStatus === 'loading' || (isLoading && !fetchError && !isClient)) {
    return ( <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div> );
  }

  if (fetchError && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied or Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
      </div>
    );
  }

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'appName':
        return (<div className="space-y-2"><Label htmlFor="app-name-input" className="text-sm">Application Name</Label><Input id="app-name-input" type="text" value={appName || ''} onChange={(e) => setAppName(e.target.value)} className="mt-1" placeholder="e.g., My ATS" /></div>);
      case 'theme':
        return (
            <div className="space-y-2">
                <Label className="text-sm">Theme Preference</Label>
                <RadioGroup value={themePreference} onValueChange={(value) => setThemePreference(value as ThemePreference)} className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 mt-1">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="light" id="theme-light" /><Label htmlFor="theme-light" className="font-normal">Light</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="dark" id="theme-dark" /><Label htmlFor="theme-dark" className="font-normal">Dark</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="system" id="theme-system" /><Label htmlFor="theme-system" className="font-normal">System Default</Label></div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-2">This sets your preferred theme. Actual theme switching is handled by the header toggle using browser settings.</p>
            </div>
        );
      case 'logo':
        return (
            <div className="space-y-2">
                <Label htmlFor="app-logo-upload" className="text-sm">App Logo <span className="text-xs text-muted-foreground">(Recommended: square, max 500KB)</span></Label>
                <Input id="app-logo-upload" type="file" accept="image/*" onChange={(e) => handleLogoFileChange(e, 'appLogo')} className="mt-1" />
                {logoPreviewUrl && (<div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3"><Image src={logoPreviewUrl} alt="Logo preview" width={48} height={48} className="h-12 w-12 object-contain rounded" data-ai-hint="company logo"/><Button variant="ghost" size="icon" onClick={() => removeSelectedImage('appLogo', false)} className="h-7 w-7"> <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/> </Button></div>)}
                {savedLogoDataUrl && ( <div className="mt-2"> <Button variant="outline" size="sm" onClick={() => removeSelectedImage('appLogo', true)} disabled={isSaving}> {isSaving && savedLogoDataUrl === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>} Reset to Default Logo </Button> </div> )}
            </div>
        );
      case 'primaryColors':
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="primary-gradient-start" className="text-sm">Gradient Start Color (HSL)</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input id="primary-gradient-start" type="text" value={primaryGradientStart || ''} onChange={(e) => setPrimaryGradientStart(e.target.value)} placeholder="e.g., 179 67% 66%" className="flex-grow"/>
                            <Input type="color" value={convertHslStringToHex(primaryGradientStart)} onChange={(e) => setPrimaryGradientStart(hexToHslString(e.target.value))} className="w-10 h-10 p-1 flex-shrink-0 rounded-md border" title="Pick color"/>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Enter as HSL string (e.g., "179 67% 66%").</p>
                    </div>
                    <div>
                        <Label htmlFor="primary-gradient-end" className="text-sm">Gradient End Color (HSL)</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input id="primary-gradient-end" type="text" value={primaryGradientEnd || ''} onChange={(e) => setPrimaryGradientEnd(e.target.value)} placeholder="e.g., 238 74% 61%" className="flex-grow"/>
                            <Input type="color" value={convertHslStringToHex(primaryGradientEnd)} onChange={(e) => setPrimaryGradientEnd(hexToHslString(e.target.value))} className="w-10 h-10 p-1 flex-shrink-0 rounded-md border" title="Pick color"/>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Enter as HSL string (e.g., "238 74% 61%").</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={resetPrimaryColors} disabled={isSaving}><RotateCcw className="mr-2 h-4 w-4"/>Reset Primary Colors</Button>
            </div>
        );
      case 'loginAppearance':
        return (
            <div className="space-y-4">
                <div><Label className="text-sm">Background Type</Label><RadioGroup value={loginBgType} onValueChange={(value) => setLoginBgType(value as LoginPageBackgroundType)} className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-1"><div className="flex items-center space-x-2"><RadioGroupItem value="default" id="loginbg-default" /><Label htmlFor="loginbg-default" className="font-normal">Default</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="image" id="loginbg-image" /><Label htmlFor="loginbg-image" className="font-normal">Image</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="color" id="loginbg-color" /><Label htmlFor="loginbg-color" className="font-normal">Single Color</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="gradient" id="loginbg-gradient" /><Label htmlFor="loginbg-gradient" className="font-normal">Gradient</Label></div></RadioGroup></div>
                {loginBgType === 'image' && (<div><Label htmlFor="login-bg-image-upload" className="text-sm">Login Background Image <span className="text-xs text-muted-foreground">(Max 500KB)</span></Label><Input id="login-bg-image-upload" type="file" accept="image/*" onChange={(e) => handleLogoFileChange(e, 'loginBg')} className="mt-1" />{loginBgImagePreviewUrl && (<div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3"><Image src={loginBgImagePreviewUrl} alt="Login background preview" width={96} height={54} className="h-12 w-20 object-cover rounded" data-ai-hint="abstract background"/><Button variant="ghost" size="icon" onClick={() => removeSelectedImage('loginBg', false)} className="h-7 w-7"> <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/> </Button></div>)}{savedLoginBgImageUrl && ( <div className="mt-2"> <Button variant="outline" size="sm" onClick={() => removeSelectedImage('loginBg', true)} disabled={isSaving}> {isSaving && savedLoginBgImageUrl === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>} Clear Saved Image </Button> </div> )}</div>)}
                {loginBgType === 'color' && (<div><Label htmlFor="login-bg-color1" className="text-sm">Background Color</Label><div className="flex items-center gap-2 mt-1"><Input id="login-bg-color1" type="color" value={loginBgColor1 || ''} onChange={(e) => setLoginBgColor1(e.target.value)} className="w-20 h-10 p-1 rounded-md border" /><Input type="text" value={loginBgColor1 || ''} onChange={(e) => setLoginBgColor1(e.target.value)} placeholder="#RRGGBB" className="max-w-[100px]" /></div></div>)}
                {loginBgType === 'gradient' && (<div className="space-y-2"><div><Label htmlFor="login-bg-gradient-color1" className="text-sm">Gradient Color 1</Label><div className="flex items-center gap-2 mt-1"><Input id="login-bg-gradient-color1" type="color" value={loginBgColor1 || ''} onChange={(e) => setLoginBgColor1(e.target.value)} className="w-20 h-10 p-1 rounded-md border" /><Input type="text" value={loginBgColor1 || ''} onChange={(e) => setLoginBgColor1(e.target.value)} placeholder="#RRGGBB" className="max-w-[100px]" /></div></div><div><Label htmlFor="login-bg-gradient-color2" className="text-sm">Gradient Color 2</Label><div className="flex items-center gap-2 mt-1"><Input id="login-bg-gradient-color2" type="color" value={loginBgColor2 || ''} onChange={(e) => setLoginBgColor2(e.target.value)} className="w-20 h-10 p-1 rounded-md border" /><Input type="text" value={loginBgColor2 || ''} onChange={(e) => setLoginBgColor2(e.target.value)} placeholder="#RRGGBB" className="max-w-[100px]" /></div></div></div>)}
                <Button variant="outline" size="sm" onClick={resetLoginBackground} disabled={isSaving}><RotateCcw className="mr-2 h-4 w-4"/>Reset Login Background</Button>
            </div>
        );
       case 'sidebarAppearance':
        return (
            <Tabs defaultValue="light-sidebar" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="light-sidebar">Light Theme Sidebar</TabsTrigger>
                    <TabsTrigger value="dark-sidebar">Dark Theme Sidebar</TabsTrigger>
                </TabsList>
                <TabsContent value="light-sidebar">
                    {renderSidebarColorInputs('Light')}
                     <Button variant="outline" size="sm" onClick={() => resetSidebarColors('Light')} disabled={isSaving} className="mt-4"><RotateCcw className="mr-2 h-4 w-4"/>Reset Light Sidebar Colors</Button>
                </TabsContent>
                <TabsContent value="dark-sidebar">
                    {renderSidebarColorInputs('Dark')}
                    <Button variant="outline" size="sm" onClick={() => resetSidebarColors('Dark')} disabled={isSaving} className="mt-4"><RotateCcw className="mr-2 h-4 w-4"/>Reset Dark Sidebar Colors</Button>
                </TabsContent>
            </Tabs>
         );
      default:
        return null;
    }
  };
  
  const renderSidebarColorInputs = (theme: 'Light' | 'Dark') => {
    const suffix = theme === 'Light' ? 'L' : 'D';
    const keys: (keyof SidebarColors)[] = [
      `sidebarBgStart${suffix}` as keyof SidebarColors, 
      `sidebarBgEnd${suffix}` as keyof SidebarColors, 
      `sidebarText${suffix}` as keyof SidebarColors,
      `sidebarActiveBgStart${suffix}` as keyof SidebarColors, 
      `sidebarActiveBgEnd${suffix}` as keyof SidebarColors, 
      `sidebarActiveText${suffix}` as keyof SidebarColors,
      `sidebarHoverBg${suffix}` as keyof SidebarColors, 
      `sidebarHoverText${suffix}` as keyof SidebarColors, 
      `sidebarBorder${suffix}` as keyof SidebarColors
    ];
    const labels: Record<string, string> = { 
      [`sidebarBgStart${suffix}`]: "Background Start", [`sidebarBgEnd${suffix}`]: "Background End", [`sidebarText${suffix}`]: "Text Color",
      [`sidebarActiveBgStart${suffix}`]: "Active BG Start", [`sidebarActiveBgEnd${suffix}`]: "Active BG End", [`sidebarActiveText${suffix}`]: "Active Text",
      [`sidebarHoverBg${suffix}`]: "Hover Background", [`sidebarHoverText${suffix}`]: "Hover Text", [`sidebarBorder${suffix}`]: "Border Color",
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {keys.map(key => (
          <div key={key}>
            <Label htmlFor={key} className="text-xs">{labels[key]}</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input id={key} type="text" value={sidebarColors[key] || ''} onChange={(e) => handleSidebarColorChange(key as keyof SidebarColors, e.target.value)} placeholder="e.g., 220 25% 97% or #aabbcc" className="h-9 text-xs flex-grow"/>
              <Input type="color" value={convertHslStringToHex(sidebarColors[key])} 
                 onChange={(e) => handleSidebarColorChange(key as keyof SidebarColors, hexToHslString(e.target.value))} 
                 className="w-10 h-9 p-1 flex-shrink-0 rounded-md border" title="Pick color"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Enter HSL (e.g., "220 25% 97%")</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-2xl"><Settings2 className="mr-3 h-6 w-6 text-primary"/>Application Preferences</CardTitle>
        <CardDescription>Manage global application settings. These settings are saved on the server.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-18rem)]">
          <aside className="md:w-72 lg:w-80 border-r bg-muted/30">
            <ScrollArea className="h-full md:max-h-[calc(100vh-18rem)] p-4">
              <nav className="space-y-1">
                {PREFERENCE_SECTIONS.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "default" : "ghost"}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                        "w-full justify-start text-left h-auto py-2.5 px-3",
                        activeSection === section.id && "btn-primary-gradient text-primary-foreground"
                    )}
                  >
                    <section.icon className="mr-3 h-5 w-5" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{section.label}</span>
                        <span className={cn("text-xs opacity-80", activeSection === section.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{section.description}</span>
                    </div>
                  </Button>
                ))}
              </nav>
            </ScrollArea>
          </aside>

          <main className="flex-1">
            <ScrollArea className="h-full md:max-h-[calc(100vh-18rem)] p-6">
              <div className="space-y-6">
                {renderSectionContent(activeSection)}
              </div>
            </ScrollArea>
          </main>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-end p-6">
        <Button onClick={handleSavePreferences} className="w-full sm:w-auto btn-primary-gradient" disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save All Preferences'}
        </Button>
      </CardFooter>
    </Card>
  );
}

    
