
"use client";
import { useState, useEffect, type ChangeEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, ImageUp, Trash2, Loader2, XCircle, PenSquare, ServerCrash, ShieldAlert, Settings2 } from 'lucide-react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { SystemSetting } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type ThemePreference = "light" | "dark" | "system";
const DEFAULT_APP_NAME = "CandiTrack";

const PREFERENCE_SECTIONS = [
  { id: 'appName', label: 'App Name', icon: PenSquare },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'logo', label: 'Logo', icon: ImageUp },
];

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
      
      const appNameSetting = settings.find(s => s.key === 'appName');
      setAppName(appNameSetting?.value || DEFAULT_APP_NAME);

      const themeSetting = settings.find(s => s.key === 'appThemePreference');
      setThemePreference((themeSetting?.value as ThemePreference) || 'system');
      
      const logoSetting = settings.find(s => s.key === 'appLogoDataUrl');
      setSavedLogoDataUrl(logoSetting?.value || null);
      setLogoPreviewUrl(logoSetting?.value || null);

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

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 200 * 1024) { 
            toast({ title: "Logo Too Large", description: "Please select an image smaller than 200KB.", variant: "destructive" });
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
      }
    }
  };

  const removeSelectedLogo = async (clearSaved: boolean = false) => {
    setSelectedLogoFile(null);
    const fileInput = document.getElementById('app-logo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';

    if (clearSaved) {
      setIsSaving(true);
      try {
        const response = await fetch('/api/settings/system-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ key: 'appLogoDataUrl', value: null }]),
        });
        if (!response.ok) throw new Error('Failed to reset logo on server.');
        setSavedLogoDataUrl(null);
        setLogoPreviewUrl(null);
        toast({ title: "Logo Cleared", description: "The application logo has been reset." });
        window.dispatchEvent(new CustomEvent('appConfigChanged', { detail: { logoUrl: null } }));
      } catch (error) {
        toast({ title: "Error Resetting Logo", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    } else {
      setLogoPreviewUrl(savedLogoDataUrl);
    }
  };

  const handleSavePreferences = async () => {
    if (!isClient) return;
    setIsSaving(true);
    
    const settingsToUpdate: Partial<SystemSetting>[] = [
      { key: 'appName', value: appName || DEFAULT_APP_NAME },
      { key: 'appThemePreference', value: themePreference },
    ];

    if (selectedLogoFile && logoPreviewUrl) { 
      settingsToUpdate.push({ key: 'appLogoDataUrl', value: logoPreviewUrl });
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
      
      const updatedSettings: SystemSetting[] = await response.json();
      const updatedLogoSetting = updatedSettings.find(s => s.key === 'appLogoDataUrl');
      if (updatedLogoSetting) {
        setSavedLogoDataUrl(updatedLogoSetting.value);
        setLogoPreviewUrl(updatedLogoSetting.value); 
      }
      const updatedThemeSetting = updatedSettings.find(s => s.key === 'appThemePreference');
      if (updatedThemeSetting) {
        setThemePreference(updatedThemeSetting.value as ThemePreference || 'system');
      }
      const updatedAppNameSetting = updatedSettings.find(s => s.key === 'appName');
       if (updatedAppNameSetting) {
        setAppName(updatedAppNameSetting.value || DEFAULT_APP_NAME);
      }

      toast({ title: 'Preferences Saved', description: 'Your application preferences have been saved to the server.' });
      window.dispatchEvent(new CustomEvent('appConfigChanged', { 
        detail: { 
          appName: updatedAppNameSetting?.value || appName || DEFAULT_APP_NAME,
          logoUrl: updatedLogoSetting ? updatedLogoSetting.value : savedLogoDataUrl,
        } 
      }));
    } catch (error) {
      console.error("Error saving preferences to server:", error);
      toast({ title: "Error Saving Preferences", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setSelectedLogoFile(null);
    }
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

  return (
    <Card className="shadow-lg overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-10rem)]"> {/* Ensure Card fills height */}
        {/* Left Gradient Panel - HIDDEN ON MOBILE */}
        <div className="hidden md:block md:w-64 lg:w-72 bg-preferences-gradient p-6 text-primary-foreground sticky top-0 h-full">
          <div className="space-y-6">
            {PREFERENCE_SECTIONS.map(section => (
              <a key={section.id} href={`#section-${section.id}`} 
                 className="flex items-center space-x-3 opacity-80 hover:opacity-100 transition-opacity py-2 px-2 rounded-md hover:bg-white/10">
                <section.icon className="h-5 w-5" />
                <span>{section.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          <CardHeader className="md:pl-6">
            <CardTitle className="flex items-center text-2xl"><Settings2 className="mr-3 h-6 w-6 text-primary"/>Application Preferences</CardTitle>
            <CardDescription>Manage global application settings like name, theme, and logo. These settings are saved on the server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6 md:pl-6">
            <section id="section-appName">
              <div className="flex items-center mb-3">
                  <PenSquare className="mr-3 h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">App Name</h3>
              </div>
              <div>
                  <Label htmlFor="app-name-input" className="text-sm">Application Name</Label>
                  <Input id="app-name-input" type="text" value={appName} onChange={(e) => setAppName(e.target.value)} className="mt-1" placeholder="e.g., My ATS" />
              </div>
            </section>

            <Separator />

            <section id="section-theme">
              <div className="flex items-center mb-3">
                  <Palette className="mr-3 h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Theme Preference</h3>
              </div>
              <RadioGroup value={themePreference} onValueChange={(value) => setThemePreference(value as ThemePreference)} className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2"><RadioGroupItem value="light" id="theme-light" /><Label htmlFor="theme-light" className="font-normal">Light</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="dark" id="theme-dark" /><Label htmlFor="theme-dark" className="font-normal">Dark</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="system" id="theme-system" /><Label htmlFor="theme-system" className="font-normal">System Default</Label></div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-2">This sets your preferred theme. Actual theme switching is handled by the header toggle using browser settings.</p>
            </section>

            <Separator />

            <section id="section-logo">
              <div className="flex items-center mb-3">
                <ImageUp className="mr-3 h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">App Logo</h3>
              </div>
              <div>
                <Label htmlFor="app-logo-upload" className="text-sm">Change App Logo <span className="text-xs text-muted-foreground">(Recommended: square, max 200KB)</span></Label>
                <Input id="app-logo-upload" type="file" accept="image/*" onChange={handleLogoFileChange} className="mt-1" />
                {logoPreviewUrl && (
                  <div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3 bg-muted/50">
                    <Image src={logoPreviewUrl} alt="Logo preview" width={48} height={48} className="h-12 w-12 object-contain rounded" data-ai-hint="company logo"/>
                    {selectedLogoFile && <span className="text-sm text-foreground truncate max-w-[150px] sm:max-w-xs">{selectedLogoFile.name}</span>}
                    <Button variant="ghost" size="icon" onClick={() => removeSelectedLogo(false)} className="h-7 w-7"> <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/> </Button>
                  </div>
                )}
                {savedLogoDataUrl && ( <div className="mt-2"> <Button variant="outline" size="sm" onClick={() => removeSelectedLogo(true)} disabled={isSaving}> {isSaving && savedLogoDataUrl === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>} Reset to Default Logo </Button> </div> )}
              </div>
            </section>
          </CardContent>
          <CardFooter className="border-t pt-6 md:pl-6">
            <Button onClick={handleSavePreferences} className="w-full sm:w-auto btn-primary-gradient" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save All Preferences'}
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

    