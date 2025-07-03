"use client";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, ImageUp, Trash2, Loader2, XCircle, PenSquare, Sidebar } from 'lucide-react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useSidebarPreferences, type SidebarStyleConfig } from '@/hooks/use-sidebar-preferences';
import { updateSidebarCSSVariables } from '@/lib/sidebar-styles';

const APP_THEME_KEY = 'appThemePreference';
const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName'; // Key for app name
const DEFAULT_APP_NAME = "CandiTrack"; // Default app name

type ThemePreference = "light" | "dark" | "system";

export default function PreferencesSettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Preferences state
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [appName, setAppName] = useState<string>(DEFAULT_APP_NAME);
  const { sidebarStyle, updateSidebarStyle } = useSidebarPreferences();

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

            // Sidebar preferences are now handled by the hook
        }
    }
  }, [sessionStatus, router, pathname, signIn]);

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 100 * 1024) { // Max 100KB
            toast({ title: "Logo Too Large", description: "Please select an image smaller than 100KB.", variant: "destructive" });
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
        toast({ title: "Invalid File Type", description: "Please select an image file (e.g., PNG, JPG, SVG).", variant: "destructive" });
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
        toast({ title: "Logo Cleared", description: "The application logo has been reset to default." });
        window.dispatchEvent(new CustomEvent('appConfigChanged', { detail: { logoUrl: null } }));
    } else {
        setLogoPreviewUrl(savedLogoDataUrl);
    }
  };

  const handleSavePreferences = () => {
    if (!isClient) return;
    localStorage.setItem(APP_THEME_KEY, themePreference);
    localStorage.setItem(APP_CONFIG_APP_NAME_KEY, appName || DEFAULT_APP_NAME); // Save app name

    // Update CSS variables for sidebar styling
    updateSidebarCSSVariables(sidebarStyle);

    let logoUpdated = false;
    if (selectedLogoFile && logoPreviewUrl) {
      localStorage.setItem(APP_LOGO_DATA_URL_KEY, logoPreviewUrl);
      setSavedLogoDataUrl(logoPreviewUrl);
      logoUpdated = true;
    }

    toast({
      title: 'Preferences Saved',
      description: 'Your preferences have been updated locally.',
    });

    // Dispatch a single event for any config change
    window.dispatchEvent(new CustomEvent('appConfigChanged', { 
      detail: { 
        appName: appName || DEFAULT_APP_NAME,
        logoUrl: logoUpdated ? logoPreviewUrl : savedLogoDataUrl,
        sidebarStyle: sidebarStyle
      } 
    }));
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
              Note: This theme preference is visual only for this prototype. Actual theme switching is handled by the header toggle.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Sidebar className="mr-2 h-5 w-5" /> Sidebar Styling
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sidebar-style">Selected Menu Style</Label>
                <Select
                  value={sidebarStyle.style}
                  onValueChange={(value) => setSidebarStyle(prev => ({ ...prev, style: value as SidebarStylePreference }))}
                >
                  <SelectTrigger id="sidebar-style" className="mt-1">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (Gradient)</SelectItem>
                    <SelectItem value="gradient">Custom Gradient</SelectItem>
                    <SelectItem value="solid">Solid Color</SelectItem>
                    <SelectItem value="outline">Outline Style</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose how selected menu items appear in the sidebar.
                </p>
              </div>

              <div>
                <Label htmlFor="shadow-intensity">Shadow Intensity</Label>
                <Select
                  value={sidebarStyle.shadowIntensity}
                  onValueChange={(value) => setSidebarStyle(prev => ({ ...prev, shadowIntensity: value as any }))}
                >
                  <SelectTrigger id="shadow-intensity" className="mt-1">
                    <SelectValue placeholder="Select shadow intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Adjust the shadow effect on selected menu items.
                </p>
              </div>

              {(sidebarStyle.style === 'gradient' || sidebarStyle.style === 'solid') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <Input
                      id="primary-color"
                      type="color"
                      value={sidebarStyle.primaryColor || '#3F51B5'}
                      onChange={(e) => setSidebarStyle(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="mt-1 h-10"
                    />
                  </div>
                  {sidebarStyle.style === 'gradient' && (
                    <div>
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <Input
                        id="secondary-color"
                        type="color"
                        value={sidebarStyle.secondaryColor || '#5C6BC0'}
                        onChange={(e) => setSidebarStyle(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="mt-1 h-10"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="text-color">Text Color</Label>
                <Input
                  id="text-color"
                  type="color"
                  value={sidebarStyle.textColor || '#FFFFFF'}
                  onChange={(e) => setSidebarStyle(prev => ({ ...prev, textColor: e.target.value }))}
                  className="mt-1 h-10"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Color of text on selected menu items.
                </p>
              </div>
            </div>
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
