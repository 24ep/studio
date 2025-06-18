
"use client";
import { useState, useEffect, type ChangeEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, ImageUp, Trash2, Loader2, XCircle, PenSquare, ServerCrash, ShieldAlert, Settings2, Wallpaper, Droplets, Type } from 'lucide-react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { SystemSetting, LoginPageBackgroundType } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type ThemePreference = "light" | "dark" | "system";
const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_LOGIN_BG_TYPE: LoginPageBackgroundType = "default";
const DEFAULT_LOGIN_BG_COLOR1 = "#F0F4F7";
const DEFAULT_LOGIN_BG_COLOR2 = "#3F51B5";


const PREFERENCE_SECTIONS = [
  { id: 'appName', label: 'App Name', icon: PenSquare },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'logo', label: 'Logo', icon: ImageUp },
  { id: 'loginAppearance', label: 'Login Page', icon: Wallpaper },
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

  // App preferences
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [appName, setAppName] = useState<string>(DEFAULT_APP_NAME);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoDataUrl, setSavedLogoDataUrl] = useState<string | null>(null);

  // Login page appearance preferences
  const [loginBgType, setLoginBgType] = useState<LoginPageBackgroundType>(DEFAULT_LOGIN_BG_TYPE);
  const [selectedLoginBgFile, setSelectedLoginBgFile] = useState<File | null>(null);
  const [loginBgImagePreviewUrl, setLoginBgImagePreviewUrl] = useState<string | null>(null);
  const [savedLoginBgImageUrl, setSavedLoginBgImageUrl] = useState<string | null>(null);
  const [loginBgColor1, setLoginBgColor1] = useState<string>(DEFAULT_LOGIN_BG_COLOR1);
  const [loginBgColor2, setLoginBgColor2] = useState<string>(DEFAULT_LOGIN_BG_COLOR2);


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

      // Load login page settings
      setLoginBgType(settings.find(s => s.key === 'loginPageBackgroundType')?.value as LoginPageBackgroundType || DEFAULT_LOGIN_BG_TYPE);
      const savedLoginImgUrl = settings.find(s => s.key === 'loginPageBackgroundImageUrl')?.value || null;
      setSavedLoginBgImageUrl(savedLoginImgUrl);
      setLoginBgImagePreviewUrl(savedLoginImgUrl); // Initialize preview with saved image
      setLoginBgColor1(settings.find(s => s.key === 'loginPageBackgroundColor1')?.value || DEFAULT_LOGIN_BG_COLOR1);
      setLoginBgColor2(settings.find(s => s.key === 'loginPageBackgroundColor2')?.value || DEFAULT_LOGIN_BG_COLOR2);


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
        if (file.size > 500 * 1024) { // Increased to 500KB for background images
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
    } else { // loginBg
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
  
  const saveSpecificSetting = async (key: SystemSetting['key'], value: string | null) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ key, value }]),
      });
      if (!response.ok) throw new Error(`Failed to save ${key} on server.`);
      // Optionally refetch all settings or update specific state based on response
    } catch (error) {
      toast({ title: `Error Saving ${key}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };


  const handleSavePreferences = async () => {
    if (!isClient) return;
    setIsSaving(true);
    
    const settingsToUpdate: Partial<SystemSetting>[] = [
      { key: 'appName', value: appName || DEFAULT_APP_NAME },
      { key: 'appThemePreference', value: themePreference },
      { key: 'loginPageBackgroundType', value: loginBgType },
      { key: 'loginPageBackgroundColor1', value: loginBgColor1 },
      { key: 'loginPageBackgroundColor2', value: loginBgColor2 },
    ];

    if (selectedLogoFile && logoPreviewUrl) { 
      settingsToUpdate.push({ key: 'appLogoDataUrl', value: logoPreviewUrl });
    }
    if (selectedLoginBgFile && loginBgImagePreviewUrl && loginBgType === 'image') {
      settingsToUpdate.push({ key: 'loginPageBackgroundImageUrl', value: loginBgImagePreviewUrl });
    } else if (loginBgType !== 'image' && savedLoginBgImageUrl !== null) {
      // If type changed away from image, and there was a saved image, clear it
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
      
      const updatedSettings: SystemSetting[] = await response.json();
      
      const updatedLogoSetting = updatedSettings.find(s => s.key === 'appLogoDataUrl');
      if (updatedLogoSetting) { setSavedLogoDataUrl(updatedLogoSetting.value); setLogoPreviewUrl(updatedLogoSetting.value); }
      
      const updatedThemeSetting = updatedSettings.find(s => s.key === 'appThemePreference');
      if (updatedThemeSetting) { setThemePreference(updatedThemeSetting.value as ThemePreference || 'system'); }
      
      const updatedAppNameSetting = updatedSettings.find(s => s.key === 'appName');
      if (updatedAppNameSetting) { setAppName(updatedAppNameSetting.value || DEFAULT_APP_NAME); }

      // Update login page settings state from response
      const updatedLoginBgType = updatedSettings.find(s => s.key === 'loginPageBackgroundType')?.value as LoginPageBackgroundType || DEFAULT_LOGIN_BG_TYPE;
      const updatedLoginBgImage = updatedSettings.find(s => s.key === 'loginPageBackgroundImageUrl')?.value || null;
      const updatedLoginBgColor1 = updatedSettings.find(s => s.key === 'loginPageBackgroundColor1')?.value || DEFAULT_LOGIN_BG_COLOR1;
      const updatedLoginBgColor2 = updatedSettings.find(s => s.key === 'loginPageBackgroundColor2')?.value || DEFAULT_LOGIN_BG_COLOR2;

      setLoginBgType(updatedLoginBgType);
      setSavedLoginBgImageUrl(updatedLoginBgImage);
      if (updatedLoginBgType === 'image') setLoginBgImagePreviewUrl(updatedLoginBgImage); else setLoginBgImagePreviewUrl(null);
      setLoginBgColor1(updatedLoginBgColor1);
      setLoginBgColor2(updatedLoginBgColor2);


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
      setSelectedLogoFile(null); // Clear selected file after save attempt
      setSelectedLoginBgFile(null);
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
            <CardDescription>Manage global application settings like name, theme, logo, and login page appearance. These settings are saved on the server.</CardDescription>
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
                <Input id="app-logo-upload" type="file" accept="image/*" onChange={(e) => handleLogoFileChange(e, 'appLogo')} className="mt-1" />
                {logoPreviewUrl && (
                  <div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3 bg-muted/50">
                    <Image src={logoPreviewUrl} alt="Logo preview" width={48} height={48} className="h-12 w-12 object-contain rounded" data-ai-hint="company logo"/>
                    {selectedLogoFile && <span className="text-sm text-foreground truncate max-w-[150px] sm:max-w-xs">{selectedLogoFile.name}</span>}
                    <Button variant="ghost" size="icon" onClick={() => removeSelectedImage('appLogo', false)} className="h-7 w-7"> <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/> </Button>
                  </div>
                )}
                {savedLogoDataUrl && ( <div className="mt-2"> <Button variant="outline" size="sm" onClick={() => removeSelectedImage('appLogo', true)} disabled={isSaving}> {isSaving && savedLogoDataUrl === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>} Reset to Default Logo </Button> </div> )}
              </div>
            </section>

            <Separator />
            
            <section id="section-loginAppearance">
              <div className="flex items-center mb-3">
                <Wallpaper className="mr-3 h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">Login Page Appearance</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Background Type</Label>
                  <RadioGroup value={loginBgType} onValueChange={(value) => setLoginBgType(value as LoginPageBackgroundType)} className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-1">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="default" id="loginbg-default" /><Label htmlFor="loginbg-default" className="font-normal">Default</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="image" id="loginbg-image" /><Label htmlFor="loginbg-image" className="font-normal">Image</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="color" id="loginbg-color" /><Label htmlFor="loginbg-color" className="font-normal">Single Color</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="gradient" id="loginbg-gradient" /><Label htmlFor="loginbg-gradient" className="font-normal">Gradient</Label></div>
                  </RadioGroup>
                </div>

                {loginBgType === 'image' && (
                  <div>
                    <Label htmlFor="login-bg-image-upload" className="text-sm">Login Background Image <span className="text-xs text-muted-foreground">(Max 500KB)</span></Label>
                    <Input id="login-bg-image-upload" type="file" accept="image/*" onChange={(e) => handleLogoFileChange(e, 'loginBg')} className="mt-1" />
                    {loginBgImagePreviewUrl && (
                      <div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3 bg-muted/50">
                        <Image src={loginBgImagePreviewUrl} alt="Login background preview" width={96} height={54} className="h-12 w-20 object-cover rounded" data-ai-hint="abstract background"/>
                        {selectedLoginBgFile && <span className="text-sm text-foreground truncate max-w-[150px] sm:max-w-xs">{selectedLoginBgFile.name}</span>}
                        <Button variant="ghost" size="icon" onClick={() => removeSelectedImage('loginBg', false)} className="h-7 w-7"> <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/> </Button>
                      </div>
                    )}
                     {savedLoginBgImageUrl && ( <div className="mt-2"> <Button variant="outline" size="sm" onClick={() => removeSelectedImage('loginBg', true)} disabled={isSaving}> {isSaving && savedLoginBgImageUrl === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>} Clear Saved Image </Button> </div> )}
                  </div>
                )}

                {loginBgType === 'color' && (
                  <div>
                    <Label htmlFor="login-bg-color1" className="text-sm">Background Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input id="login-bg-color1" type="color" value={loginBgColor1} onChange={(e) => setLoginBgColor1(e.target.value)} className="w-20 h-10 p-1" />
                      <Input type="text" value={loginBgColor1} onChange={(e) => setLoginBgColor1(e.target.value)} placeholder="#RRGGBB" className="max-w-[100px]" />
                    </div>
                  </div>
                )}

                {loginBgType === 'gradient' && (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="login-bg-gradient-color1" className="text-sm">Gradient Color 1</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input id="login-bg-gradient-color1" type="color" value={loginBgColor1} onChange={(e) => setLoginBgColor1(e.target.value)} className="w-20 h-10 p-1" />
                        <Input type="text" value={loginBgColor1} onChange={(e) => setLoginBgColor1(e.target.value)} placeholder="#RRGGBB" className="max-w-[100px]" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="login-bg-gradient-color2" className="text-sm">Gradient Color 2</Label>
                       <div className="flex items-center gap-2 mt-1">
                        <Input id="login-bg-gradient-color2" type="color" value={loginBgColor2} onChange={(e) => setLoginBgColor2(e.target.value)} className="w-20 h-10 p-1" />
                        <Input type="text" value={loginBgColor2} onChange={(e) => setLoginBgColor2(e.target.value)} placeholder="#RRGGBB" className="max-w-[100px]" />
                      </div>
                    </div>
                  </div>
                )}
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
    
