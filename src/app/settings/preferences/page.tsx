
"use client";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, ImageUp, Trash2 } from 'lucide-react';

const APP_THEME_KEY = 'appThemePreference';
const APP_LOGO_FILENAME_KEY = 'appLogoFilename';

type ThemePreference = "light" | "dark" | "system";

export default function PreferencesSettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  // Preferences state
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');

  // App Logo state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoFilename, setSavedLogoFilename] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(APP_THEME_KEY) as ThemePreference | null;
      if (storedTheme) setThemePreference(storedTheme);

      const storedLogoFilename = localStorage.getItem(APP_LOGO_FILENAME_KEY);
      if (storedLogoFilename) setSavedLogoFilename(storedLogoFilename);
    }
  }, []);

  useEffect(() => {
    if (selectedLogoFile) {
      const objectUrl = URL.createObjectURL(selectedLogoFile);
      setLogoPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setLogoPreviewUrl(null);
    }
  }, [selectedLogoFile]);

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedLogoFile(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
        setSelectedLogoFile(null);
        event.target.value = ''; 
      }
    } else {
      setSelectedLogoFile(null);
    }
  };
  
  const removeSelectedLogo = () => {
    setSelectedLogoFile(null);
    setLogoPreviewUrl(null);
    const fileInput = document.getElementById('app-logo-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  const handleSavePreferences = () => {
    if (!isClient) return;
    localStorage.setItem(APP_THEME_KEY, themePreference);

    if (selectedLogoFile) {
      localStorage.setItem(APP_LOGO_FILENAME_KEY, selectedLogoFile.name);
      setSavedLogoFilename(selectedLogoFile.name); 
      setSelectedLogoFile(null); 
    }
    
    toast({
      title: 'Preferences Saved',
      description: 'Your preferences have been updated locally.',
    });
  };

  if (!isClient) {
    return (
        <div className="space-y-6">
          <Card className="w-full max-w-xl mx-auto shadow-lg animate-pulse">
            <CardHeader>
              <CardTitle className="h-8 bg-muted rounded"></CardTitle>
              <CardDescription className="h-4 bg-muted rounded mt-1"></CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <div className="h-6 bg-muted rounded w-1/4 mb-2"></div>
                <div className="space-y-2">
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                </div>
              </div>
              <div>
                <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
                 <div className="h-20 bg-muted rounded mt-2"></div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-muted rounded w-32"></div>
            </CardFooter>
          </Card>
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
              <Label htmlFor="app-logo-upload">Change App Logo</Label>
              <Input
                id="app-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="mt-1"
              />
              {logoPreviewUrl && (
                <div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3 bg-muted/50">
                  <img src={logoPreviewUrl} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                  <span className="text-sm text-foreground truncate max-w-xs">{selectedLogoFile?.name}</span>
                  <Button variant="ghost" size="icon" onClick={removeSelectedLogo} className="h-7 w-7">
                    <Trash2 className="h-4 w-4 text-destructive"/>
                    <span className="sr-only">Remove selected logo</span>
                  </Button>
                </div>
              )}
              {savedLogoFilename && !selectedLogoFile && !logoPreviewUrl && (
                 <p className="text-sm text-muted-foreground mt-1">
                  Current conceptually "saved" logo: <strong>{savedLogoFilename}</strong>. Select a new file to change.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Select an image to replace the application logo (conceptual for this prototype).
              </p>
            </div>
          </section>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePreferences}>
            <Save className="mr-2 h-4 w-4" /> Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    