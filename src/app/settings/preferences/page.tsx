
"use client";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, ImageUp, Trash2, Loader2, XCircle } from 'lucide-react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname

const APP_THEME_KEY = 'appThemePreference';
const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';

type ThemePreference = "light" | "dark" | "system";

export default function PreferencesSettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  // Preferences state
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');

  // App Logo state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null); // This will hold the data URL for preview
  const [savedLogoDataUrl, setSavedLogoDataUrl] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname }); // Use pathname
    } else if (sessionStatus === 'authenticated') {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem(APP_THEME_KEY) as ThemePreference | null;
            if (storedTheme) setThemePreference(storedTheme);

            const storedLogoDataUrl = localStorage.getItem(APP_LOGO_DATA_URL_KEY);
            if (storedLogoDataUrl) {
                setSavedLogoDataUrl(storedLogoDataUrl);
                setLogoPreviewUrl(storedLogoDataUrl); // Initialize preview with saved logo
            }
        }
    }
  }, [sessionStatus, router, pathname, signIn]); // Added pathname and signIn to dependencies

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 100 * 1024) { // Max 100KB
            toast({ title: "Logo Too Large", description: "Please select an image smaller than 100KB.", variant: "destructive" });
            setSelectedLogoFile(null);
            setLogoPreviewUrl(savedLogoDataUrl); // Revert to saved logo if new one is too large
            event.target.value = '';
            return;
        }
        setSelectedLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreviewUrl(reader.result as string); // Set preview to the new file's data URL
        };
        reader.readAsDataURL(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please select an image file (e.g., PNG, JPG, SVG).", variant: "destructive" });
        setSelectedLogoFile(null);
        setLogoPreviewUrl(savedLogoDataUrl); // Revert to saved logo if type is invalid
        event.target.value = '';
      }
    } else {
      setSelectedLogoFile(null);
      setLogoPreviewUrl(savedLogoDataUrl); // Revert to saved logo if selection is cleared
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
        window.dispatchEvent(new Event('logoChanged')); // Notify layout to update
    } else {
        setLogoPreviewUrl(savedLogoDataUrl); // Revert preview to the currently saved logo
    }
  };

  const handleSavePreferences = () => {
    if (!isClient) return;
    localStorage.setItem(APP_THEME_KEY, themePreference);

    let logoUpdated = false;
    if (selectedLogoFile && logoPreviewUrl) {
      // If a new file was selected and preview (data URL) exists, save it
      localStorage.setItem(APP_LOGO_DATA_URL_KEY, logoPreviewUrl);
      setSavedLogoDataUrl(logoPreviewUrl);
      logoUpdated = true;
    } else if (!selectedLogoFile && !logoPreviewUrl && savedLogoDataUrl) {
      // This case implies the user cleared a preview of a *new* file, wants to keep existing or cleared existing
      // The removeSelectedLogo(true) case handles actual clearing from storage
    }


    toast({
      title: 'Preferences Saved',
      description: 'Your preferences have been updated locally.',
    });

    if (logoUpdated) {
        window.dispatchEvent(new Event('logoChanged')); // Notify layout to update the logo
    }
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
          <CardDescription>Manage your application theme and logo preferences. Settings are saved locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
