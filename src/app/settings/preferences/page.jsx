"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Palette, Trash2, Loader2, XCircle, ServerCrash, Wallpaper, Droplets, Type, Sidebar as SidebarIcon, RotateCcw, Monitor, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { setThemeAndColors } from '@/lib/themeUtils';
const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_PRIMARY_GRADIENT_START = "179 67% 66%";
const DEFAULT_PRIMARY_GRADIENT_END = "238 74% 61%";
const DEFAULT_LOGIN_BG_TYPE = "default";
const DEFAULT_LOGIN_BG_COLOR1_HEX = "#F0F4F7";
const DEFAULT_LOGIN_BG_COLOR2_HEX = "#3F51B5";
const DEFAULT_LOGIN_LAYOUT_TYPE = 'center';
const DEFAULT_SIDEBAR_COLORS_BASE = {
    sidebarBgStartL: "220 25% 97%", sidebarBgEndL: "220 20% 94%", sidebarTextL: "220 25% 30%",
    sidebarActiveBgStartL: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndL: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextL: "0 0% 100%",
    sidebarHoverBgL: "220 10% 92%", sidebarHoverTextL: "220 25% 25%", sidebarBorderL: "220 15% 85%",
    sidebarBgStartD: "220 15% 12%", sidebarBgEndD: "220 15% 9%", sidebarTextD: "210 30% 85%",
    sidebarActiveBgStartD: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndD: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextD: "0 0% 100%",
    sidebarHoverBgD: "220 15% 20%", sidebarHoverTextD: "210 30% 90%", sidebarBorderD: "220 15% 18%"
};
const createInitialSidebarColors = () => ({
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
// Color conversion utilities
function parseHslString(hslString) {
    const match = hslString === null || hslString === void 0 ? void 0 : hslString.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
    if (!match)
        return null;
    return {
        h: parseInt(match[1], 10),
        s: parseInt(match[2], 10) / 100,
        l: parseInt(match[3], 10) / 100,
    };
}
function hslToHex(h, s, l) {
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
function hexToHslString(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.startsWith('#'))
        hex = hex.substring(1);
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    }
    else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    else {
        return "0 0% 0%";
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    const lPercent = Math.round(l * 100);
    return `${h} ${s}% ${lPercent}%`;
}
function convertHslStringToHex(hslString) {
    if (!hslString)
        return '#000000';
    const hslObj = parseHslString(hslString);
    if (!hslObj)
        return '#000000';
    return hslToHex(hslObj.h, hslObj.s, hslObj.l);
}
// Helper to update sidebar CSS variables for live preview
const SIDEBAR_COLOR_KEYS = [
    'sidebarBgStartL', 'sidebarBgEndL', 'sidebarTextL',
    'sidebarActiveBgStartL', 'sidebarActiveBgEndL', 'sidebarActiveTextL',
    'sidebarHoverBgL', 'sidebarHoverTextL', 'sidebarBorderL',
    'sidebarBgStartD', 'sidebarBgEndD', 'sidebarTextD',
    'sidebarActiveBgStartD', 'sidebarActiveBgEndD', 'sidebarActiveTextD',
    'sidebarHoverBgD', 'sidebarHoverTextD', 'sidebarBorderD',
];
function setSidebarCSSVars(settings) {
    if (typeof window === 'undefined')
        return;
    const root = document.documentElement;
    SIDEBAR_COLOR_KEYS.forEach(key => {
        const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        if (settings[key]) {
            root.style.setProperty(`--${cssVar}`, settings[key]);
        }
    });
}
// Add FONT_FALLBACK above its first usage
const FONT_FALLBACK = [
    { label: 'Poppins', value: 'Poppins' },
];
// Add this helper for filtering font options above its usage
function filterFontOptions(options, input) {
    if (!input)
        return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(input.toLowerCase()));
}
export default function PreferencesSettingsPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    // State management
    const [themePreference, setThemePreference] = useState('system');
    const [appName, setAppName] = useState(DEFAULT_APP_NAME);
    const [selectedLogoFile, setSelectedLogoFile] = useState(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
    const [savedLogoDataUrl, setSavedLogoDataUrl] = useState(null);
    const [primaryGradientStart, setPrimaryGradientStart] = useState(DEFAULT_PRIMARY_GRADIENT_START);
    const [primaryGradientEnd, setPrimaryGradientEnd] = useState(DEFAULT_PRIMARY_GRADIENT_END);
    const [loginBgType, setLoginBgType] = useState(DEFAULT_LOGIN_BG_TYPE);
    const [selectedLoginBgFile, setSelectedLoginBgFile] = useState(null);
    const [loginBgImagePreviewUrl, setLoginBgImagePreviewUrl] = useState(null);
    const [savedLoginBgImageUrl, setSavedLoginBgImageUrl] = useState(null);
    const [loginBgColor1, setLoginBgColor1] = useState(DEFAULT_LOGIN_BG_COLOR1_HEX);
    const [loginBgColor2, setLoginBgColor2] = useState(DEFAULT_LOGIN_BG_COLOR2_HEX);
    const [sidebarColors, setSidebarColors] = useState(createInitialSidebarColors());
    const [loginLayoutType, setLoginLayoutType] = useState('center');
    const [appFontFamily, setAppFontFamily] = useState('Poppins');
    const [isFontLoading, setIsFontLoading] = useState(false);
    const [fontValidationWarning, setFontValidationWarning] = useState(null);
    const [fontOptions, setFontOptions] = useState(FONT_FALLBACK);
    const [isFontListLoading, setIsFontListLoading] = useState(false);
    const fontValidationTimeout = useRef(null);
    const GOOGLE_FONTS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY || '';
    const sectionRefs = {
        branding: useRef(null),
        theme: useRef(null),
        primaryColors: useRef(null),
        loginAppearance: useRef(null),
        sidebarAppearance: useRef(null),
    };
    // Add at the top of the PreferencesSettingsPage component
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);
    // Fetch system settings
    const fetchSystemSettings = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await fetch('/api/settings/system-settings');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to load system settings' }));
                throw new Error(errorData.message);
            }
            const settings = await response.json();
            const settingsMap = new Map(settings.map(s => [s.key, s.value]));
            setAppName(settingsMap.get('appName') || DEFAULT_APP_NAME);
            setThemePreference(settingsMap.get('appThemePreference') || 'system');
            const logoUrl = settingsMap.get('appLogoDataUrl') || null;
            setSavedLogoDataUrl(logoUrl);
            setLogoPreviewUrl(logoUrl);
            setPrimaryGradientStart(settingsMap.get('primaryGradientStart') || DEFAULT_PRIMARY_GRADIENT_START);
            setPrimaryGradientEnd(settingsMap.get('primaryGradientEnd') || DEFAULT_PRIMARY_GRADIENT_END);
            setLoginBgType(settingsMap.get('loginPageBackgroundType') || DEFAULT_LOGIN_BG_TYPE);
            const loginBgUrl = settingsMap.get('loginPageBackgroundImageUrl') || null;
            setSavedLoginBgImageUrl(loginBgUrl);
            setLoginBgImagePreviewUrl(loginBgUrl);
            setLoginBgColor1(settingsMap.get('loginPageBackgroundColor1') || DEFAULT_LOGIN_BG_COLOR1_HEX);
            setLoginBgColor2(settingsMap.get('loginPageBackgroundColor2') || DEFAULT_LOGIN_BG_COLOR2_HEX);
            setLoginLayoutType(settingsMap.get('loginPageLayoutType') || DEFAULT_LOGIN_LAYOUT_TYPE);
            setAppFontFamily(settingsMap.get('appFontFamily') || 'Poppins');
            // Load sidebar colors
            const newSidebarColors = createInitialSidebarColors();
            Object.keys(newSidebarColors).forEach(key => {
                const value = settingsMap.get(key);
                if (value) {
                    newSidebarColors[key] = value;
                }
            });
            setSidebarColors(newSidebarColors);
            setSidebarCSSVars(newSidebarColors);
        }
        catch (error) {
            console.error('Failed to fetch system settings:', error);
            setFetchError(error.message || 'Failed to load system settings');
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            fetchSystemSettings();
        }
    }, [sessionStatus, fetchSystemSettings]);
    // Event handlers
    const handleSidebarColorChange = (key, value) => {
        setSidebarColors(prev => (Object.assign(Object.assign({}, prev), { [key]: value })));
    };
    const handleLogoFileChange = (event, type) => {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        if (file.size > 500 * 1024) {
            toast.error("Please select an image smaller than 500KB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            const dataUrl = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
            if (type === 'appLogo') {
                setSelectedLogoFile(file);
                setLogoPreviewUrl(dataUrl);
            }
            else {
                setSelectedLoginBgFile(file);
                setLoginBgImagePreviewUrl(dataUrl);
            }
        };
        reader.readAsDataURL(file);
    };
    const removeSelectedImage = async (type, clearSaved = false) => {
        if (type === 'appLogo') {
            setSelectedLogoFile(null);
            setLogoPreviewUrl(null);
            if (clearSaved) {
                setSavedLogoDataUrl(null);
                await saveSpecificSetting('appLogoDataUrl', null);
            }
        }
        else {
            setSelectedLoginBgFile(null);
            setLoginBgImagePreviewUrl(null);
            if (clearSaved) {
                setSavedLoginBgImageUrl(null);
                await saveSpecificSetting('loginPageBackgroundImageUrl', null);
            }
        }
    };
    const saveSpecificSetting = async (key, value) => {
        try {
            const response = await fetch('/api/settings/system-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{ key, value }]),
            });
            if (!response.ok)
                throw new Error('Failed to save setting');
        }
        catch (error) {
            console.error(`Failed to save ${key}:`, error);
            throw error;
        }
    };
    const handleSavePreferences = async () => {
        setIsSaving(true);
        try {
            const settingsToSave = [
                { key: 'appName', value: appName },
                { key: 'appThemePreference', value: themePreference },
                { key: 'primaryGradientStart', value: primaryGradientStart },
                { key: 'primaryGradientEnd', value: primaryGradientEnd },
                { key: 'loginPageBackgroundType', value: loginBgType },
                { key: 'loginPageBackgroundColor1', value: loginBgColor1 },
                { key: 'loginPageBackgroundColor2', value: loginBgColor2 },
                { key: 'loginPageLayoutType', value: loginLayoutType },
                { key: 'appFontFamily', value: appFontFamily },
            ];
            // Add sidebar colors
            Object.entries(sidebarColors).forEach(([key, value]) => {
                if (key in sidebarColors) {
                    settingsToSave.push({ key: key, value });
                }
            });
            // Save all settings in a single request
            await fetch('/api/settings/system-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsToSave),
            });
            // Handle file uploads (logo and login background image)
            let logoDataUrl = savedLogoDataUrl;
            if (selectedLogoFile) {
                logoDataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => { var _a; return resolve((_a = e.target) === null || _a === void 0 ? void 0 : _a.result); };
                    reader.readAsDataURL(selectedLogoFile);
                });
                await saveSpecificSetting('appLogoDataUrl', logoDataUrl);
                setSelectedLogoFile(null);
                setSavedLogoDataUrl(logoDataUrl);
                setLogoPreviewUrl(logoDataUrl);
            }
            let loginBgDataUrl = savedLoginBgImageUrl;
            if (selectedLoginBgFile) {
                loginBgDataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => { var _a; return resolve((_a = e.target) === null || _a === void 0 ? void 0 : _a.result); };
                    reader.readAsDataURL(selectedLoginBgFile);
                });
                await saveSpecificSetting('loginPageBackgroundImageUrl', loginBgDataUrl);
                setSelectedLoginBgFile(null);
                setSavedLoginBgImageUrl(loginBgDataUrl);
                setLoginBgImagePreviewUrl(loginBgDataUrl);
            }
            // Update localStorage for app name and logo
            if (typeof window !== 'undefined') {
                localStorage.setItem('appConfigAppName', appName);
                if (logoDataUrl) {
                    localStorage.setItem('appLogoDataUrl', logoDataUrl);
                }
                else {
                    localStorage.removeItem('appLogoDataUrl');
                }
            }
            // Set theme and color CSS variables
            setThemeAndColors({
                themePreference,
                primaryGradientStart,
                primaryGradientEnd,
                sidebarColors,
            });
            // Dispatch custom event for other tabs/components
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('appConfigChanged', {
                    detail: {
                        appName,
                        logoUrl: logoDataUrl,
                        themePreference,
                        primaryGradientStart,
                        primaryGradientEnd,
                        sidebarColors,
                    },
                }));
            }
            toast.success("Your application preferences have been saved successfully.");
        }
        catch (error) {
            console.error('Failed to save preferences:', error);
            toast.error(error.message || "Failed to save preferences. Please try again.");
        }
        finally {
            setIsSaving(false);
        }
    };
    // Reset functions
    const resetPrimaryColors = () => {
        setPrimaryGradientStart(DEFAULT_PRIMARY_GRADIENT_START);
        setPrimaryGradientEnd(DEFAULT_PRIMARY_GRADIENT_END);
        toast.success("Primary colors reset to default. Click 'Save All' to persist.");
    };
    const resetLoginBackground = () => {
        setLoginBgType(DEFAULT_LOGIN_BG_TYPE);
        setLoginBgColor1(DEFAULT_LOGIN_BG_COLOR1_HEX);
        setLoginBgColor2(DEFAULT_LOGIN_BG_COLOR2_HEX);
        setSelectedLoginBgFile(null);
        setLoginBgImagePreviewUrl(null);
        toast.success("Login background reset to default. Click 'Save All' to persist.");
    };
    const resetSidebarColors = (themeType) => {
        const suffix = themeType === 'Light' ? 'L' : 'D';
        const defaultColorsForTheme = {
            [`sidebarBgStart${suffix}`]: DEFAULT_SIDEBAR_COLORS_BASE[`sidebarBgStart${suffix}`],
            [`sidebarBgEnd${suffix}`]: DEFAULT_SIDEBAR_COLORS_BASE[`sidebarBgEnd${suffix}`],
            [`sidebarText${suffix}`]: DEFAULT_SIDEBAR_COLORS_BASE[`sidebarText${suffix}`],
            [`sidebarActiveBgStart${suffix}`]: DEFAULT_SIDEBAR_COLORS_BASE[`sidebarActiveBgStart${suffix}`],
            [`sidebarActiveBgEnd${suffix}`]: DEFAULT_SIDEBAR_COLORS_BASE[`sidebarActiveBgEnd${suffix}`],
            [`sidebarActiveText${suffix}`]: DEFAULT_SIDEBAR_COLORS_BASE[`sidebarActiveText${suffix}`],
            [`sidebarHoverBg${suffix}`]: DEFAULT_SIDEBAR_COLORS_BASE[`sidebarHoverBg${suffix}`],
            [`sidebarHoverText${suffix}`]: DEFAULT_SIDEBAR_COLORS_BASE[`sidebarHoverText${suffix}`],
            [`sidebarBorder${suffix}`]: DEFAULT_SIDEBAR_COLORS_BASE[`sidebarBorder${suffix}`],
        };
        setSidebarColors(prev => {
            const updated = Object.assign(Object.assign({}, prev), { [`sidebarBgStart${suffix}`]: defaultColorsForTheme[`sidebarBgStart${suffix}`], [`sidebarBgEnd${suffix}`]: defaultColorsForTheme[`sidebarBgEnd${suffix}`], [`sidebarText${suffix}`]: defaultColorsForTheme[`sidebarText${suffix}`], [`sidebarActiveBgStart${suffix}`]: defaultColorsForTheme[`sidebarActiveBgStart${suffix}`], [`sidebarActiveBgEnd${suffix}`]: defaultColorsForTheme[`sidebarActiveBgEnd${suffix}`], [`sidebarActiveText${suffix}`]: defaultColorsForTheme[`sidebarActiveText${suffix}`], [`sidebarHoverBg${suffix}`]: defaultColorsForTheme[`sidebarHoverBg${suffix}`], [`sidebarHoverText${suffix}`]: defaultColorsForTheme[`sidebarHoverText${suffix}`], [`sidebarBorder${suffix}`]: defaultColorsForTheme[`sidebarBorder${suffix}`] });
            setSidebarCSSVars(updated);
            return updated;
        });
        toast.success(`${themeType} sidebar colors reset to default. Click 'Save All' to persist.`);
    };
    // Fetch full Google Fonts list on page load
    useEffect(() => {
        if (!GOOGLE_FONTS_API_KEY)
            return;
        setIsFontListLoading(true);
        fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=alpha`)
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch Google Fonts list'))
            .then(data => {
            if (data.items && Array.isArray(data.items)) {
                setFontOptions(data.items.map((item) => ({ label: item.family, value: item.family })));
            }
        })
            .catch(() => setFontOptions(FONT_FALLBACK))
            .finally(() => setIsFontListLoading(false));
    }, [GOOGLE_FONTS_API_KEY]);
    // Validate font name (debounced)
    useEffect(() => {
        if (!appFontFamily) {
            setFontValidationWarning(null);
            return;
        }
        // If it's in the loaded list, it's valid
        if (fontOptions.some(opt => opt.value.toLowerCase() === appFontFamily.toLowerCase())) {
            setFontValidationWarning(null);
            return;
        }
        // Debounce API call
        if (fontValidationTimeout.current)
            clearTimeout(fontValidationTimeout.current);
        fontValidationTimeout.current = setTimeout(async () => {
            if (!GOOGLE_FONTS_API_KEY) {
                setFontValidationWarning(null);
                return;
            }
            try {
                const res = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=alpha`);
                if (!res.ok)
                    throw new Error('Failed to fetch Google Fonts list');
                const data = await res.json();
                const found = data.items.some((item) => item.family.toLowerCase() === appFontFamily.toLowerCase());
                setFontValidationWarning(found ? null : 'Font not found on Google Fonts.');
            }
            catch (_a) {
                setFontValidationWarning(null); // Fail silently
            }
        }, 500);
        return () => {
            if (fontValidationTimeout.current)
                clearTimeout(fontValidationTimeout.current);
        };
    }, [appFontFamily, GOOGLE_FONTS_API_KEY, fontOptions]);
    // On sidebarColors change, update CSS vars for live preview
    useEffect(() => {
        setSidebarCSSVars(sidebarColors);
    }, [sidebarColors]);
    // Live update --font-dynamic CSS variable for font preview
    useEffect(() => {
        if (typeof window !== 'undefined' && appFontFamily) {
            let fontVar = '';
            switch (appFontFamily) {
                case 'Open Sans':
                    fontVar = 'var(--font-open-sans)';
                    break;
                case 'Roboto':
                    fontVar = 'var(--font-roboto)';
                    break;
                case 'Inter':
                    fontVar = 'var(--font-inter)';
                    break;
                case 'Montserrat':
                    fontVar = 'var(--font-montserrat)';
                    break;
                case 'Lato':
                    fontVar = 'var(--font-lato)';
                    break;
                case 'Nunito':
                    fontVar = 'var(--font-nunito)';
                    break;
                case 'Source Sans 3':
                    fontVar = 'var(--font-source-sans-3)';
                    break;
                case 'Raleway':
                    fontVar = 'var(--font-raleway)';
                    break;
                case 'Ubuntu':
                    fontVar = 'var(--font-ubuntu)';
                    break;
                case 'Quicksand':
                    fontVar = 'var(--font-quicksand)';
                    break;
                case 'PT Sans':
                    fontVar = 'var(--font-pt-sans)';
                    break;
                default: fontVar = 'var(--font-poppins)';
            }
            document.documentElement.style.setProperty('--font-dynamic', fontVar);
        }
    }, [appFontFamily]);
    // Loading and error states
    if (sessionStatus === 'loading' || (isLoading && !fetchError && !isClient)) {
        return (<div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary"/>
      </div>);
    }
    if (fetchError && !isLoading) {
        return (<div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4"/>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied or Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">
          Go to Dashboard
        </Button>
      </div>);
    }
    return (<div className="flex gap-8 relative">
      {/* Only render the right content */}
      <div className="flex-1 space-y-12 pb-32 p-6">
        <div ref={sectionRefs.branding} id="branding">
          {/* Branding section content */}
          <div className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="app-name-input" className="text-sm font-medium">
                Application Name
              </Label>
              <Input id="app-name-input" type="text" value={appName || ''} onChange={(e) => setAppName(e.target.value)} placeholder="Enter application name" className="max-w-md"/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-logo-upload" className="text-sm font-medium">
                Application Logo
              </Label>
              <div className="flex items-center gap-4">
                <Input id="app-logo-upload" type="file" accept="image/*" onChange={(e) => handleLogoFileChange(e, 'appLogo')} className="max-w-md"/>
                {logoPreviewUrl && (<div className="flex items-center gap-2 p-2 border rounded-md">
                    <Image src={logoPreviewUrl} alt="Logo preview" width={32} height={32} className="h-8 w-8 object-contain rounded"/>
                    <Button variant="ghost" size="sm" onClick={() => removeSelectedImage('appLogo', false)}>
                      <XCircle className="h-4 w-4"/>
                    </Button>
                  </div>)}
              </div>
              {savedLogoDataUrl && (<Button variant="outline" size="sm" onClick={() => removeSelectedImage('appLogo', true)} disabled={isSaving}>
                  <Trash2 className="mr-2 h-4 w-4"/>
                  Remove Saved Logo
                </Button>)}
            </div>
          </div>
        </div>
        <div ref={sectionRefs.theme} id="theme">
          {/* Theme section content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary"/>
                Theme
              </CardTitle>
              <CardDescription>
                Choose your preferred theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={themePreference} onValueChange={(value) => setThemePreference(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light"/>
                  <Label htmlFor="theme-light" className="flex items-center gap-2">
                    <Sun className="h-4 w-4"/>
                    Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark"/>
                  <Label htmlFor="theme-dark" className="flex items-center gap-2">
                    <Moon className="h-4 w-4"/>
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system"/>
                  <Label htmlFor="theme-system" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4"/>
                    System
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
        <div ref={sectionRefs.primaryColors} id="primaryColors">
          {/* Primary Colors section content */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary"/>
                Primary Color Theme
              </CardTitle>
              <CardDescription>
                Customize the primary gradient colors used throughout the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-gradient-start" className="text-sm font-medium">
                    Gradient Start Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input id="primary-gradient-start" type="text" value={primaryGradientStart || ''} onChange={(e) => setPrimaryGradientStart(e.target.value)} placeholder="179 67% 66%"/>
                    <Input type="color" value={convertHslStringToHex(primaryGradientStart)} onChange={(e) => setPrimaryGradientStart(hexToHslString(e.target.value))} className="w-12 h-10 p-1 rounded-md border"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-gradient-end" className="text-sm font-medium">
                    Gradient End Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input id="primary-gradient-end" type="text" value={primaryGradientEnd || ''} onChange={(e) => setPrimaryGradientEnd(e.target.value)} placeholder="238 74% 61%"/>
                    <Input type="color" value={convertHslStringToHex(primaryGradientEnd)} onChange={(e) => setPrimaryGradientEnd(hexToHslString(e.target.value))} className="w-12 h-10 p-1 rounded-md border"/>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={resetPrimaryColors}>
                <RotateCcw className="mr-2 h-4 w-4"/>
                Reset to Default
              </Button>
            </CardContent>
          </Card>
        </div>
        <div ref={sectionRefs.loginAppearance} id="loginAppearance">
          {/* Login Page section content */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallpaper className="h-5 w-5 text-primary"/>
                Login Page Appearance
              </CardTitle>
              <CardDescription>
                Customize the background of the login page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Type</Label>
                <RadioGroup value={loginBgType} onValueChange={(value) => setLoginBgType(value)}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="loginbg-default"/>
                      <Label htmlFor="loginbg-default" className="text-sm">Default</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="loginbg-image"/>
                      <Label htmlFor="loginbg-image" className="text-sm">Image</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="color" id="loginbg-color"/>
                      <Label htmlFor="loginbg-color" className="text-sm">Color</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gradient" id="loginbg-gradient"/>
                      <Label htmlFor="loginbg-gradient" className="text-sm">Gradient</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {loginBgType === 'image' && (<div className="space-y-2">
                  <Label htmlFor="login-bg-image-upload" className="text-sm font-medium">
                    Background Image
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input id="login-bg-image-upload" type="file" accept="image/*" onChange={(e) => handleLogoFileChange(e, 'loginBg')}/>
                    {loginBgImagePreviewUrl && (<div className="flex items-center gap-2 p-2 border rounded-md">
                        <Image src={loginBgImagePreviewUrl} alt="Background preview" width={48} height={27} className="h-6 w-10 object-cover rounded"/>
                        <Button variant="ghost" size="sm" onClick={() => removeSelectedImage('loginBg', false)}>
                          <XCircle className="h-4 w-4"/>
                        </Button>
                      </div>)}
                  </div>
                  {savedLoginBgImageUrl && (<Button variant="outline" size="sm" onClick={() => removeSelectedImage('loginBg', true)} disabled={isSaving}>
                      <Trash2 className="mr-2 h-4 w-4"/>
                      Remove Saved Image
                    </Button>)}
                </div>)}

              {loginBgType === 'color' && (<div className="space-y-2">
                  <Label htmlFor="login-bg-color1" className="text-sm font-medium">
                    Background Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input id="login-bg-color1" type="color" value={loginBgColor1 || ''} onChange={(e) => setLoginBgColor1(e.target.value)} className="w-20 h-10 p-1 rounded-md border"/>
                    <Input type="text" value={loginBgColor1 || ''} onChange={(e) => setLoginBgColor1(e.target.value)} placeholder="#RRGGBB" className="max-w-[120px]"/>
                  </div>
                        </div>)}

              {loginBgType === 'gradient' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-bg-gradient-color1" className="text-sm font-medium">
                      Gradient Color 1
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input id="login-bg-gradient-color1" type="color" value={loginBgColor1 || ''} onChange={(e) => setLoginBgColor1(e.target.value)} className="w-20 h-10 p-1 rounded-md border"/>
                      <Input type="text" value={loginBgColor1 || ''} onChange={(e) => setLoginBgColor1(e.target.value)} placeholder="#RRGGBB" className="max-w-[120px]"/>
                    </div>
                        </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-bg-gradient-color2" className="text-sm font-medium">
                      Gradient Color 2
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input id="login-bg-gradient-color2" type="color" value={loginBgColor2 || ''} onChange={(e) => setLoginBgColor2(e.target.value)} className="w-20 h-10 p-1 rounded-md border"/>
                      <Input type="text" value={loginBgColor2 || ''} onChange={(e) => setLoginBgColor2(e.target.value)} placeholder="#RRGGBB" className="max-w-[120px]"/>
                    </div>
                    </div>
                </div>)}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Login Layout</Label>
                <RadioGroup value={loginLayoutType} onValueChange={setLoginLayoutType} className="flex flex-row gap-4 mt-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="center" id="loginlayout-center"/>
                    <Label htmlFor="loginlayout-center" className="text-sm">Center Box</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2column" id="loginlayout-2column"/>
                    <Label htmlFor="loginlayout-2column" className="text-sm">2-Column (Login as Left Menu)</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-1">Choose how the login form is displayed: centered box or 2-column with login as a left menu.</p>
            </div>

              <Button variant="outline" size="sm" onClick={resetLoginBackground}>
                <RotateCcw className="mr-2 h-4 w-4"/>
                Reset to Default
              </Button>
            </CardContent>
          </Card>
            </div>
        <div ref={sectionRefs.sidebarAppearance} id="sidebarAppearance">
          {/* Sidebar Colors section content */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SidebarIcon className="h-5 w-5 text-primary"/>
                Sidebar Colors
              </CardTitle>
              <CardDescription>
                Customize the sidebar appearance for light and dark themes
              </CardDescription>
            </CardHeader>
            <CardContent>
            <Tabs defaultValue="light-sidebar" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="light-sidebar" className="flex items-center gap-2">
                    <Sun className="h-4 w-4"/>
                    Light Theme
                  </TabsTrigger>
                  <TabsTrigger value="dark-sidebar" className="flex items-center gap-2">
                    <Moon className="h-4 w-4"/>
                    Dark Theme
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="light-sidebar" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderSidebarColorInputs('Light')}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => resetSidebarColors('Light')}>
                    <RotateCcw className="mr-2 h-4 w-4"/>
                    Reset Light Theme Colors
                  </Button>
                </TabsContent>
                
                <TabsContent value="dark-sidebar" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderSidebarColorInputs('Dark')}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => resetSidebarColors('Dark')}>
                    <RotateCcw className="mr-2 h-4 w-4"/>
                    Reset Dark Theme Colors
                  </Button>
                </TabsContent>
            </Tabs>
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-lg ">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl gap-2">
              <Type className="h-7 w-7 text-primary"/>
              Application Font
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Choose the font family for the entire application UI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Combobox/Autocomplete for font selection */}
            <div className="relative w-64">
              <Input type="text" value={appFontFamily} onChange={e => setAppFontFamily(e.target.value)} placeholder="Type or select a Google Font" className="pr-8" list="font-family-list" autoComplete="off"/>
              {(isFontLoading || isFontListLoading) && (<div className="absolute right-2 top-2 text-xs text-muted-foreground flex items-center gap-1">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-md"></span>
                  {isFontListLoading ? 'Loading fonts...' : 'Loading font...'}
                </div>)}
              <datalist id="font-family-list">
                {filterFontOptions(fontOptions, appFontFamily).map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </datalist>
              <div className="text-xs text-muted-foreground mt-1">You can type any Google Font name, or pick from the list.</div>
              {fontValidationWarning && (<div className="text-xs text-red-600 mt-1">{fontValidationWarning}</div>)}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Floating Save/Reset Bar */}
      <div className="fixed bottom-6 right-6 z-30 bg-background/95 border shadow-lg rounded-xl flex flex-row gap-4 py-3 px-6" style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)' }}>
        <Button onClick={handleSavePreferences} disabled={isSaving} className="btn-primary-gradient flex items-center gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} Save All
        </Button>
        <Button variant="outline" onClick={fetchSystemSettings} disabled={isSaving} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4"/> Reset
        </Button>
      </div>
    </div>);
    function renderSidebarColorInputs(theme) {
        const suffix = theme === 'Light' ? 'L' : 'D';
        const keys = [
            `sidebarBgStart${suffix}`,
            `sidebarBgEnd${suffix}`,
            `sidebarText${suffix}`,
            `sidebarActiveBgStart${suffix}`,
            `sidebarActiveBgEnd${suffix}`,
            `sidebarActiveText${suffix}`,
            `sidebarHoverBg${suffix}`,
            `sidebarHoverText${suffix}`,
            `sidebarBorder${suffix}`
        ];
        const labels = {
            [`sidebarBgStart${suffix}`]: "Background Start",
            [`sidebarBgEnd${suffix}`]: "Background End",
            [`sidebarText${suffix}`]: "Text Color",
            [`sidebarActiveBgStart${suffix}`]: "Active BG Start",
            [`sidebarActiveBgEnd${suffix}`]: "Active BG End",
            [`sidebarActiveText${suffix}`]: "Active Text",
            [`sidebarHoverBg${suffix}`]: "Hover Background",
            [`sidebarHoverText${suffix}`]: "Hover Text",
            [`sidebarBorder${suffix}`]: "Border Color",
        };
        return keys.map(key => (<div key={key} className="space-y-2">
        <Label htmlFor={String(key)} className="text-sm font-medium">
          {labels[String(key)]}
        </Label>
        <div className="flex items-center gap-2">
          <Input id={String(key)} type="text" value={sidebarColors[key] || ''} onChange={(e) => handleSidebarColorChange(key, e.target.value)} placeholder="220 25% 97%" className="text-sm"/>
          <Input type="color" value={convertHslStringToHex(sidebarColors[key])} onChange={(e) => handleSidebarColorChange(key, hexToHslString(e.target.value))} className="w-10 h-9 p-1 rounded-md border"/>
            </div>
      </div>));
    }
}
