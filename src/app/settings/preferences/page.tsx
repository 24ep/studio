"use client";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, ImageUp, Trash2, Loader2, XCircle, PenSquare, Sidebar, Paintbrush } from 'lucide-react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { applySidebarActiveStyle, setThemeAndColors } from '@/lib/themeUtils';

const APP_THEME_KEY = 'appThemePreference';
const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName'; // Key for app name
const SIDEBAR_ACTIVE_STYLE_KEY = 'sidebarActiveStylePreference'; // Key for sidebar active style
const DEFAULT_APP_NAME = "CandiTrack"; // Default app name

type ThemePreference = "light" | "dark" | "system";
type SidebarActiveStyle = "gradient" | "solid" | "outline" | "subtle";

export default function PreferencesSettingsPage() {
  const { show, success, error } = useToast();
  const [isClient, setIsClient] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Preferences state
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [appName, setAppName] = useState<string>(DEFAULT_APP_NAME);
  const [sidebarActiveStyle, setSidebarActiveStyle] = useState<SidebarActiveStyle>('gradient');

  // Sidebar Colors state
  const [sidebarColors, setSidebarColors] = useState({
    // Light theme
    sidebarBgStartL: '0 0% 100%', // White
    sidebarBgEndL: '0 0% 100%', // White
    sidebarTextL: '222.2 84% 4.9%', // Dark text
    sidebarActiveBgStartL: '179 67% 66%', // Primary start
    sidebarActiveBgEndL: '238 74% 61%', // Primary end
    sidebarActiveTextL: '0 0% 100%', // White text
    sidebarHoverBgL: '210 40% 98%', // Light hover
    sidebarHoverTextL: '222.2 84% 4.9%', // Dark text
    sidebarBorderL: '214.3 31.8% 91.4%', // Light border
    
    // Dark theme
    sidebarBgStartD: '222.2 84% 4.9%', // Dark background
    sidebarBgEndD: '222.2 84% 4.9%', // Dark background
    sidebarTextD: '210 40% 98%', // Light text
    sidebarActiveBgStartD: '179 67% 66%', // Primary start
    sidebarActiveBgEndD: '238 74% 61%', // Primary end
    sidebarActiveTextD: '0 0% 100%', // White text
    sidebarHoverBgD: '217.2 32.6% 17.5%', // Dark hover
    sidebarHoverTextD: '210 40% 98%', // Light text
    sidebarBorderD: '217.2 32.6% 17.5%', // Dark border
  });

  // App Logo state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoDataUrl, setSavedLogoDataUrl] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem(APP_THEME_KEY) as ThemePreference | null;
            if (storedTheme) setThemePreference(storedTheme);

            const storedLogoDataUrl = localStorage.getItem(APP_LOGO_DATA_URL_KEY);
            if (storedLogoDataUrl) {
                setSavedLogoDataUrl(storedLogoDataUrl);
                setLogoPreviewUrl(storedLogoDataUrl);
            }

            const storedAppName = localStorage.getItem(APP_CONFIG_APP_NAME_KEY);
            setAppName(storedAppName || DEFAULT_APP_NAME);

            const storedSidebarStyle = localStorage.getItem(SIDEBAR_ACTIVE_STYLE_KEY) as SidebarActiveStyle | null;
            if (storedSidebarStyle) setSidebarActiveStyle(storedSidebarStyle);

            // Load saved sidebar colors
            const savedSidebarColors: Record<string, string> = {};
            const colorKeys = [
              'sidebarBgStartL', 'sidebarBgEndL', 'sidebarTextL', 'sidebarActiveBgStartL', 'sidebarActiveBgEndL', 'sidebarActiveTextL', 'sidebarHoverBgL', 'sidebarHoverTextL', 'sidebarBorderL',
              'sidebarBgStartD', 'sidebarBgEndD', 'sidebarTextD', 'sidebarActiveBgStartD', 'sidebarActiveBgEndD', 'sidebarActiveTextD', 'sidebarHoverBgD', 'sidebarHoverTextD', 'sidebarBorderD'
            ];
            
            colorKeys.forEach(key => {
              const saved = localStorage.getItem(key);
              if (saved) {
                savedSidebarColors[key] = saved;
              }
            });
            
            if (Object.keys(savedSidebarColors).length > 0) {
              setSidebarColors(prev => ({ ...prev, ...savedSidebarColors }));
            }
        }
    }
  }, [sessionStatus, router, pathname, signIn]);

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 100 * 1024) { // Max 100KB
            error("Please select an image smaller than 100KB.");
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
        error("Please select an image file (e.g., PNG, JPG, SVG).");
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
        localStorage.removeItem(APP_LOGO_DATA_URL_KEY);
        setSavedLogoDataUrl(null);
        setLogoPreviewUrl(null);
        success("The application logo has been reset to default.");
        window.dispatchEvent(new CustomEvent('appConfigChanged', { detail: { logoUrl: null } }));
    } else {
        setLogoPreviewUrl(savedLogoDataUrl);
    }
  };

  const handleSavePreferences = () => {
    if (!isClient) return;
    localStorage.setItem(APP_THEME_KEY, themePreference);
    localStorage.setItem(APP_CONFIG_APP_NAME_KEY, appName || DEFAULT_APP_NAME); // Save app name
    localStorage.setItem(SIDEBAR_ACTIVE_STYLE_KEY, sidebarActiveStyle); // Save sidebar style

    // Save sidebar colors
    Object.entries(sidebarColors).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    let logoUpdated = false;
    if (selectedLogoFile && logoPreviewUrl) {
      localStorage.setItem(APP_LOGO_DATA_URL_KEY, logoPreviewUrl);
      setSavedLogoDataUrl(logoPreviewUrl);
      logoUpdated = true;
    }

    success('Your preferences have been updated locally.');

    // Dispatch a single event for any config change
    window.dispatchEvent(new CustomEvent('appConfigChanged', { 
      detail: { 
        appName: appName || DEFAULT_APP_NAME,
        logoUrl: logoUpdated ? logoPreviewUrl : savedLogoDataUrl,
        sidebarActiveStyle: sidebarActiveStyle,
        sidebarColors: sidebarColors
      } 
    }));
  };

  const handleSidebarStyleChange = (value: string) => {
    const newStyle = value as SidebarActiveStyle;
    setSidebarActiveStyle(newStyle);
    // Apply immediately for preview
    applySidebarActiveStyle(newStyle);
  };

  const handleSidebarColorChange = (key: string, value: string) => {
    setSidebarColors(prev => ({ ...prev, [key]: value }));
    // Apply immediately for preview
    setThemeAndColors({
      themePreference,
      sidebarColors: { ...sidebarColors, [key]: value }
    });
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && pathname !== '/auth/signin' && !pathname.startsWith('/_next/')) || !isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-6 w-6 text-primary" /> Preferences
          </CardTitle>
          <CardDescription>Manage your application name, theme, and logo. Settings are saved locally.</CardDescription>
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
              Note: This theme preference is saved locally. Actual theme switching is handled by the header toggle.
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
                    <Button variant="outline" size="sm" onClick={() => removeSelectedLogo(true)}>
                        <Trash2 className="mr-2 h-4 w-4"/> Reset to Default Logo
                    </Button>
                 </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Select an image to replace the application logo. Changes apply after saving preferences.
                Stored in browser localStorage as a data URL (max 100KB recommended).
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Sidebar className="mr-2 h-5 w-5" /> Sidebar Active Menu Style
            </h3>
            <div>
              <Label htmlFor="sidebar-active-style">Selected Menu Item Style</Label>
              <Select value={sidebarActiveStyle} onValueChange={handleSidebarStyleChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradient Background</SelectItem>
                  <SelectItem value="solid">Solid Background</SelectItem>
                  <SelectItem value="outline">Outline Border</SelectItem>
                  <SelectItem value="subtle">Subtle Highlight</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Choose how selected menu items appear in the sidebar. Changes apply immediately.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Paintbrush className="mr-2 h-5 w-5" /> Sidebar Colors
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Light Theme Colors */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Light Theme</h4>
                  
                  <div>
                    <Label htmlFor="sidebar-bg-light">Background Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-bg-light"
                        type="text"
                        value={sidebarColors.sidebarBgStartL}
                        onChange={(e) => handleSidebarColorChange('sidebarBgStartL', e.target.value)}
                        placeholder="0 0% 100%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarBgStartL})` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sidebar-text-light">Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-text-light"
                        type="text"
                        value={sidebarColors.sidebarTextL}
                        onChange={(e) => handleSidebarColorChange('sidebarTextL', e.target.value)}
                        placeholder="222.2 84% 4.9%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarTextL})` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sidebar-active-bg-light">Active Background Start</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-active-bg-light"
                        type="text"
                        value={sidebarColors.sidebarActiveBgStartL}
                        onChange={(e) => handleSidebarColorChange('sidebarActiveBgStartL', e.target.value)}
                        placeholder="179 67% 66%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarActiveBgStartL})` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sidebar-active-bg-end-light">Active Background End</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-active-bg-end-light"
                        type="text"
                        value={sidebarColors.sidebarActiveBgEndL}
                        onChange={(e) => handleSidebarColorChange('sidebarActiveBgEndL', e.target.value)}
                        placeholder="238 74% 61%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarActiveBgEndL})` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sidebar-hover-bg-light">Hover Background</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-hover-bg-light"
                        type="text"
                        value={sidebarColors.sidebarHoverBgL}
                        onChange={(e) => handleSidebarColorChange('sidebarHoverBgL', e.target.value)}
                        placeholder="210 40% 98%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarHoverBgL})` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Dark Theme Colors */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Dark Theme</h4>
                  
                  <div>
                    <Label htmlFor="sidebar-bg-dark">Background Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-bg-dark"
                        type="text"
                        value={sidebarColors.sidebarBgStartD}
                        onChange={(e) => handleSidebarColorChange('sidebarBgStartD', e.target.value)}
                        placeholder="222.2 84% 4.9%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarBgStartD})` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sidebar-text-dark">Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-text-dark"
                        type="text"
                        value={sidebarColors.sidebarTextD}
                        onChange={(e) => handleSidebarColorChange('sidebarTextD', e.target.value)}
                        placeholder="210 40% 98%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarTextD})` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sidebar-active-bg-dark">Active Background Start</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-active-bg-dark"
                        type="text"
                        value={sidebarColors.sidebarActiveBgStartD}
                        onChange={(e) => handleSidebarColorChange('sidebarActiveBgStartD', e.target.value)}
                        placeholder="179 67% 66%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarActiveBgEndD})` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sidebar-active-bg-end-dark">Active Background End</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-active-bg-end-dark"
                        type="text"
                        value={sidebarColors.sidebarActiveBgEndD}
                        onChange={(e) => handleSidebarColorChange('sidebarActiveBgEndD', e.target.value)}
                        placeholder="238 74% 61%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarActiveBgEndD})` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sidebar-hover-bg-dark">Hover Background</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sidebar-hover-bg-dark"
                        type="text"
                        value={sidebarColors.sidebarHoverBgD}
                        onChange={(e) => handleSidebarColorChange('sidebarHoverBgD', e.target.value)}
                        placeholder="217.2 32.6% 17.5%"
                        className="flex-1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `hsl(${sidebarColors.sidebarHoverBgD})` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const defaultColors = {
                      sidebarBgStartL: '0 0% 100%',
                      sidebarBgEndL: '0 0% 100%',
                      sidebarTextL: '222.2 84% 4.9%',
                      sidebarActiveBgStartL: '179 67% 66%',
                      sidebarActiveBgEndL: '238 74% 61%',
                      sidebarActiveTextL: '0 0% 100%',
                      sidebarHoverBgL: '210 40% 98%',
                      sidebarHoverTextL: '222.2 84% 4.9%',
                      sidebarBorderL: '214.3 31.8% 91.4%',
                      sidebarBgStartD: '222.2 84% 4.9%',
                      sidebarBgEndD: '222.2 84% 4.9%',
                      sidebarTextD: '210 40% 98%',
                      sidebarActiveBgStartD: '179 67% 66%',
                      sidebarActiveBgEndD: '238 74% 61%',
                      sidebarActiveTextD: '0 0% 100%',
                      sidebarHoverBgD: '217.2 32.6% 17.5%',
                      sidebarHoverTextD: '210 40% 98%',
                      sidebarBorderD: '217.2 32.6% 17.5%',
                    };
                    setSidebarColors(defaultColors);
                    setThemeAndColors({ themePreference, sidebarColors: defaultColors });
                  }}
                >
                  Reset to Default
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Customize sidebar colors for both light and dark themes. Use HSL color format (e.g., "179 67% 66%"). 
                Changes apply immediately for preview. Save to make permanent.
              </p>
            </div>
          </section>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePreferences} className="btn-primary-gradient">
            <Save className="mr-2 h-4 w-4" /> Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
