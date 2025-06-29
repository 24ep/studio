"use client";

import React, { useEffect, useState, type ChangeEvent } from "react";
import { Loader2, Save, X, Palette, ImageUp, Trash2, XCircle, PenSquare, Sun, Moon, RotateCcw, Sidebar as SidebarIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { setThemeAndColors } from "@/lib/themeUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_THEME: ThemePreference = "system";

// Backend keys
const APP_THEME_KEY = 'themePreference';
const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_NAME_KEY = 'appName';

type ThemePreference = "light" | "dark" | "system";

// --- Sidebar color keys/types/utilities ---
const DEFAULT_PRIMARY_GRADIENT_START = "179 67% 66%";
const DEFAULT_PRIMARY_GRADIENT_END = "238 74% 61%";
const DEFAULT_SIDEBAR_COLORS_BASE = {
  sidebarBgStartL: "220 25% 97%", sidebarBgEndL: "220 20% 94%", sidebarTextL: "220 25% 30%",
  sidebarActiveBgStartL: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndL: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextL: "0 0% 100%",      
  sidebarHoverBgL: "220 10% 92%", sidebarHoverTextL: "220 25% 25%", sidebarBorderL: "220 15% 85%",
  sidebarBgStartD: "220 15% 12%", sidebarBgEndD: "220 15% 9%", sidebarTextD: "210 30% 85%",
  sidebarActiveBgStartD: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndD: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextD: "0 0% 100%",      
  sidebarHoverBgD: "220 15% 20%", sidebarHoverTextD: "210 30% 90%", sidebarBorderD: "220 15% 18%"
};
const SIDEBAR_COLOR_KEYS = [
  'sidebarBgStartL', 'sidebarBgEndL', 'sidebarTextL',
  'sidebarActiveBgStartL', 'sidebarActiveBgEndL', 'sidebarActiveTextL',
  'sidebarHoverBgL', 'sidebarHoverTextL', 'sidebarBorderL',
  'sidebarBgStartD', 'sidebarBgEndD', 'sidebarTextD',
  'sidebarActiveBgStartD', 'sidebarActiveBgEndD', 'sidebarActiveTextD',
  'sidebarHoverBgD', 'sidebarHoverTextD', 'sidebarBorderD',
];
function parseHslString(hslString: string): { h: number; s: number; l: number } | null {
  const match = hslString?.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) return null;
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]) / 100,
    l: parseFloat(match[3]) / 100,
  };
}
function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
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

interface SidebarColors {
  sidebarBgStartL: string; sidebarBgEndL: string; sidebarTextL: string;
  sidebarActiveBgStartL: string; sidebarActiveBgEndL: string; sidebarActiveTextL: string;
  sidebarHoverBgL: string; sidebarHoverTextL: string; sidebarBorderL: string;
  sidebarBgStartD: string; sidebarBgEndD: string; sidebarTextD: string;
  sidebarActiveBgStartD: string; sidebarActiveBgEndD: string; 
  sidebarActiveTextD: string;
  sidebarHoverBgD: string; sidebarHoverTextD: string; sidebarBorderD: string;
  [key: string]: string;
}

function setSidebarCSSVars(settings: SidebarColors) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  SIDEBAR_COLOR_KEYS.forEach((key: keyof SidebarColors) => {
    const cssVar = (key as string).replace(/([A-Z])/g, "-$1").toLowerCase();
    if (settings[key]) {
      root.style.setProperty(`--${cssVar}`, settings[key]);
    }
  });
}
function createInitialSidebarColors() {
  return { ...DEFAULT_SIDEBAR_COLORS_BASE };
}
// --- End sidebar color utilities ---

export default function SystemPreferencesPage() {
  const { success, error } = useToast();
  const [isClient, setIsClient] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Preferences state
  const [themePreference, setThemePreference] = useState<ThemePreference>(DEFAULT_THEME);
  const [appName, setAppName] = useState<string>(DEFAULT_APP_NAME);
  // App Logo state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoDataUrl, setSavedLogoDataUrl] = useState<string | null>(null);
  // Loading/saving/error
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Sidebar color state
  const [sidebarColors, setSidebarColors] = useState<SidebarColors>(DEFAULT_SIDEBAR_COLORS_BASE);

  const canEdit =
    session?.user?.role === "Admin" ||
    session?.user?.modulePermissions?.includes("SYSTEM_SETTINGS_MANAGE");

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      // Fetch from backend
      async function fetchPrefs() {
        setLoading(true);
        setErrorMsg(null);
        try {
          const res = await fetch('/api/settings/system-preferences');
          if (!res.ok) throw new Error('Failed to load system preferences');
          const data = await res.json();
          setThemePreference((data[APP_THEME_KEY] as ThemePreference) || DEFAULT_THEME);
          setAppName(data[APP_NAME_KEY] || DEFAULT_APP_NAME);
          setSavedLogoDataUrl(data[APP_LOGO_DATA_URL_KEY] || null);
          setLogoPreviewUrl(data[APP_LOGO_DATA_URL_KEY] || null);
          // Load sidebar colors
          const newSidebarColors = createInitialSidebarColors();
          Object.keys(newSidebarColors).forEach(key => {
            if (data[key]) newSidebarColors[key] = data[key];
          });
          setSidebarColors(newSidebarColors);
          setSidebarCSSVars(newSidebarColors);
        } catch (e: any) {
          setErrorMsg(e.message);
        } finally {
          setLoading(false);
        }
      }
      fetchPrefs();
    }
  }, [sessionStatus, router, pathname, signIn]);

  useEffect(() => {
    setSidebarCSSVars(sidebarColors);
  }, [sidebarColors]);

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 100 * 1024) { // Max 100KB
            error("Logo Too Large: Please select an image smaller than 100KB.");
            setSelectedLogoFile(null);
            setLogoPreviewUrl(savedLogoDataUrl);
            event.target.value = '';
            return;
        }
        setSelectedLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        error("Invalid File Type: Please select an image file (e.g., PNG, JPG, SVG).");
        setSelectedLogoFile(null);
        setLogoPreviewUrl(savedLogoDataUrl);
        event.target.value = '';
      }
    } else {
      setSelectedLogoFile(null);
      setLogoPreviewUrl(savedLogoDataUrl);
    }
  };

  const removeSelectedLogo = (clearSaved: boolean = false) => {
    setSelectedLogoFile(null);
    const fileInput = document.getElementById('app-logo-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
    if (clearSaved) {
        setSavedLogoDataUrl(null);
        setLogoPreviewUrl(null);
        success("Logo Cleared: The application logo has been reset to default.");
    } else {
        setLogoPreviewUrl(savedLogoDataUrl);
    }
  };

  const handleSavePreferences = async () => {
    if (!isClient || !canEdit) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(false);
    try {
      const payload = {
        [APP_THEME_KEY]: themePreference,
        [APP_NAME_KEY]: appName || DEFAULT_APP_NAME,
        [APP_LOGO_DATA_URL_KEY]: logoPreviewUrl || '',
        ...sidebarColors,
      };
      const res = await fetch('/api/settings/system-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save preferences');
      }
      setSavedLogoDataUrl(logoPreviewUrl || null);
      setSelectedLogoFile(null);
      setSuccessMsg(true);
      setThemeAndColors({ themePreference, sidebarColors });
      toast.success('Preferences Saved: System preferences have been updated.');
    } catch (e: any) {
      setErrorMsg(e.message);
      toast.error('Error: ' + e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(false), 2000);
    }
  };

  function renderSidebarColorInputs(theme: 'Light' | 'Dark') {
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
      `sidebarBorder${suffix}` as keyof SidebarColors,
    ];
    const labels: Record<string, string> = {
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
    return keys.map((key) => (
      <div key={key} className="space-y-2">
        <Label htmlFor={String(key)} className="text-sm font-medium">
          {labels[String(key)]}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={String(key)}
            type="text"
            value={sidebarColors[key] || ''}
            onChange={e => setSidebarColors((prev: SidebarColors) => ({ ...prev, [key]: e.target.value }))}
            placeholder="220 25% 97%"
            className="text-sm"
          />
          <Input
            type="color"
            value={convertHslStringToHex(sidebarColors[key])}
            onChange={e => setSidebarColors((prev: SidebarColors) => ({ ...prev, [key]: hexToHslString(e.target.value) }))}
            className="w-10 h-9 p-1 rounded-md border"
          />
        </div>
      </div>
    ));
  }

  function resetSidebarColors(theme: 'Light' | 'Dark') {
    const suffix = theme === 'Light' ? 'L' : 'D';
    const newSidebarColors = createInitialSidebarColors();
    setSidebarColors(newSidebarColors);
    setSidebarCSSVars(newSidebarColors);
  }

  if (loading || sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && pathname !== '/auth/signin' && !pathname.startsWith('/_next/')) || !isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">{errorMsg}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-6 w-6 text-primary" /> System Preferences
          </CardTitle>
          <CardDescription>Manage your application name, theme, and logo. Settings are global for all users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                <PenSquare className="mr-2 h-5 w-5" /> App Name
            </h3>
            <div>
                <Label htmlFor="app-name-input">Application Name</Label>
                <Input
                id="app-name-input"
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-1"
                placeholder="e.g., My ATS"
                disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground mt-1">
                This name will be displayed in the application header and other relevant places.
                </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">Theme</h3>
            <RadioGroup
              value={themePreference}
              onValueChange={(value) => setThemePreference(value as ThemePreference)}
              className="flex flex-col sm:flex-row sm:space-x-4"
              disabled={!canEdit}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system">System Default</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-1">
              Note: This theme preference is visual only for this prototype. Actual theme switching is handled by the header toggle.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <ImageUp className="mr-2 h-5 w-5" /> App Logo
            </h3>
            <div>
              <Label htmlFor="app-logo-upload">Change App Logo (Recommended: square, max 100KB)</Label>
              <Input
                id="app-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="mt-1"
                disabled={!canEdit}
              />
              {logoPreviewUrl && (
                <div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3 bg-muted/50">
                  <Image src={logoPreviewUrl} alt="Logo preview" width={48} height={48} className="h-12 w-12 object-contain rounded" />
                  {selectedLogoFile && <span className="text-sm text-foreground truncate max-w-xs">{selectedLogoFile.name}</span>}
                  <Button variant="ghost" size="icon" onClick={() => removeSelectedLogo(false)} className="h-7 w-7">
                    <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                    <span className="sr-only">Cancel selection</span>
                  </Button>
                </div>
              )}
              {savedLogoDataUrl && (
                 <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => removeSelectedLogo(true)} disabled={!canEdit}>
                        <Trash2 className="mr-2 h-4 w-4"/> Reset to Default Logo
                    </Button>
                 </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Select an image to replace the application logo. Changes apply after saving preferences.
                Stored in the database as a data URL (max 100KB recommended).
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Palette className="mr-2 h-5 w-5" /> Sidebar Color
            </h3>
            <div className="flex flex-wrap gap-3 items-center mb-2">
              {SIDEBAR_COLOR_KEYS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center focus:outline-none transition-all",
                    sidebarColors[swatch as keyof SidebarColors] === swatch
                      ? "border-primary ring-2 ring-primary"
                      : "border-muted"
                  )}
                  style={{ backgroundColor: `hsl(${swatch})` }}
                  onClick={() => { setSidebarColors(prev => ({ ...prev, [swatch as keyof SidebarColors]: swatch })); }}
                  aria-label={swatch}
                  disabled={!canEdit}
                >
                  {sidebarColors[swatch as keyof SidebarColors] === swatch && (
                    <span className="block w-3 h-3 rounded-full bg-white border border-primary" />
                  )}
                </button>
              ))}
              {/* Custom color input */}
              <input
                type="text"
                className="w-32 h-8 rounded border ml-2 px-2 text-sm"
                placeholder="#hex or hsl( )"
                value={sidebarColors['sidebarBgStartL' as keyof SidebarColors]}
                onChange={e => {
                  setSidebarColors((prev: SidebarColors) => ({ ...prev, ['sidebarBgStartL' as keyof SidebarColors]: e.target.value }));
                }}
                disabled={!canEdit}
                aria-label="Custom sidebar color"
              />
              <span className="text-xs ml-2">Custom</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select a color for the left menu (sidebar) background. Default is HSL blue. You can enter a custom HSL or hex code (e.g. <code>221 83% 53%</code> or <code>#2563eb</code> or <code>hsl(221 83% 53%)</code>).
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs">Current:</span>
              <span className="w-6 h-6 rounded-full border" style={{ background: (sidebarColors['sidebarBgStartL' as keyof SidebarColors] || '').startsWith('#') ? sidebarColors['sidebarBgStartL' as keyof SidebarColors] : (sidebarColors['sidebarBgStartL' as keyof SidebarColors] || '').startsWith('hsl') ? sidebarColors['sidebarBgStartL' as keyof SidebarColors] : `hsl(${sidebarColors['sidebarBgStartL' as keyof SidebarColors]})` }} />
              <span className="text-xs font-mono">{sidebarColors['sidebarBgStartL' as keyof SidebarColors]}</span>
            </div>
          </section>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePreferences} className="btn-primary-gradient" disabled={saving || !canEdit}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          {successMsg && <span className="ml-4 text-green-600">Preferences saved!</span>}
        </CardFooter>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SidebarIcon className="h-5 w-5 text-primary" />
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
                <Sun className="h-4 w-4" />
                Light Theme
              </TabsTrigger>
              <TabsTrigger value="dark-sidebar" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Dark Theme
              </TabsTrigger>
            </TabsList>
            <TabsContent value="light-sidebar" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderSidebarColorInputs('Light')}
              </div>
              <Button variant="outline" size="sm" onClick={() => resetSidebarColors('Light')}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Light Theme Colors
              </Button>
            </TabsContent>
            <TabsContent value="dark-sidebar" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderSidebarColorInputs('Dark')}
              </div>
              <Button variant="outline" size="sm" onClick={() => resetSidebarColors('Dark')}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Dark Theme Colors
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 