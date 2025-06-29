"use client";

import React, { useEffect, useState, type ChangeEvent } from "react";
import { Loader2, Save, X, Palette, ImageUp, Trash2, XCircle, PenSquare } from "lucide-react";
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

const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_THEME: ThemePreference = "system";

// Backend keys
const APP_THEME_KEY = 'themePreference';
const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_NAME_KEY = 'appName';

type ThemePreference = "light" | "dark" | "system";

export default function SystemPreferencesPage() {
  const { toast } = useToast();
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        setError(null);
        try {
          const res = await fetch('/api/settings/system-preferences');
          if (!res.ok) throw new Error('Failed to load system preferences');
          const data = await res.json();
          setThemePreference((data[APP_THEME_KEY] as ThemePreference) || DEFAULT_THEME);
          setAppName(data[APP_NAME_KEY] || DEFAULT_APP_NAME);
          setSavedLogoDataUrl(data[APP_LOGO_DATA_URL_KEY] || null);
          setLogoPreviewUrl(data[APP_LOGO_DATA_URL_KEY] || null);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      }
      fetchPrefs();
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
        setSavedLogoDataUrl(null);
        setLogoPreviewUrl(null);
        toast({ title: "Logo Cleared", description: "The application logo has been reset to default." });
    } else {
        setLogoPreviewUrl(savedLogoDataUrl);
    }
  };

  const handleSavePreferences = async () => {
    if (!isClient || !canEdit) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload: Record<string, string | null> = {
        [APP_THEME_KEY]: themePreference,
        [APP_NAME_KEY]: appName || DEFAULT_APP_NAME,
        [APP_LOGO_DATA_URL_KEY]: logoPreviewUrl || '',
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
      setSuccess(true);
      toast({ title: 'Preferences Saved', description: 'System preferences have been updated.' });
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  if (loading || sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && pathname !== '/auth/signin' && !pathname.startsWith('/_next/')) || !isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">{error}</p>
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
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePreferences} className="btn-primary-gradient" disabled={saving || !canEdit}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          {success && <span className="ml-4 text-green-600">Preferences saved!</span>}
        </CardFooter>
      </Card>
    </div>
  );
} 