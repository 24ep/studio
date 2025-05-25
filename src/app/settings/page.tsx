
"use client";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Save, Settings, Mail, Palette, ImageUp, Trash2 } from 'lucide-react'; // Added Palette, ImageUp, Trash2

const N8N_WEBHOOK_URL_KEY = 'n8nWebhookUrl';
const SMTP_HOST_KEY = 'smtpHost';
const SMTP_PORT_KEY = 'smtpPort';
const SMTP_USER_KEY = 'smtpUser';
// Note: SMTP Password is intentionally not saved to localStorage for basic security in this prototype.
const APP_THEME_KEY = 'appThemePreference';
const APP_LOGO_FILENAME_KEY = 'appLogoFilename';

type ThemePreference = "light" | "dark" | "system";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  // n8n state
  const [webhookUrl, setWebhookUrl] = useState('');

  // SMTP state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState(''); // Only for UI, not saved

  // Preferences state
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');

  // App Logo state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoFilename, setSavedLogoFilename] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedWebhookUrl = localStorage.getItem(N8N_WEBHOOK_URL_KEY);
      if (storedWebhookUrl) setWebhookUrl(storedWebhookUrl);

      const storedSmtpHost = localStorage.getItem(SMTP_HOST_KEY);
      if (storedSmtpHost) setSmtpHost(storedSmtpHost);

      const storedSmtpPort = localStorage.getItem(SMTP_PORT_KEY);
      if (storedSmtpPort) setSmtpPort(storedSmtpPort);

      const storedSmtpUser = localStorage.getItem(SMTP_USER_KEY);
      if (storedSmtpUser) setSmtpUser(storedSmtpUser);

      const storedTheme = localStorage.getItem(APP_THEME_KEY) as ThemePreference | null;
      if (storedTheme) setThemePreference(storedTheme);

      const storedLogoFilename = localStorage.getItem(APP_LOGO_FILENAME_KEY);
      if (storedLogoFilename) setSavedLogoFilename(storedLogoFilename);
    }
  }, []);

  useEffect(() => {
    // Create a preview URL when a logo file is selected
    if (selectedLogoFile) {
      const objectUrl = URL.createObjectURL(selectedLogoFile);
      setLogoPreviewUrl(objectUrl);

      // Free memory when the component unmounts or when the file changes
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setLogoPreviewUrl(null); // Clear preview if no file selected
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
        event.target.value = ''; // Reset file input
      }
    } else {
      setSelectedLogoFile(null);
    }
  };
  
  const removeSelectedLogo = () => {
    setSelectedLogoFile(null);
    // Also reset the file input element if you have a ref to it or by key
    const fileInput = document.getElementById('app-logo-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  const handleSave = () => {
    if (!isClient) return;
    localStorage.setItem(N8N_WEBHOOK_URL_KEY, webhookUrl);
    localStorage.setItem(SMTP_HOST_KEY, smtpHost);
    localStorage.setItem(SMTP_PORT_KEY, smtpPort);
    localStorage.setItem(SMTP_USER_KEY, smtpUser);
    localStorage.setItem(APP_THEME_KEY, themePreference);

    if (selectedLogoFile) {
      localStorage.setItem(APP_LOGO_FILENAME_KEY, selectedLogoFile.name);
      setSavedLogoFilename(selectedLogoFile.name); // Update UI to show new saved name
      setSelectedLogoFile(null); // Clear selection after "saving"
      // File input reset handled by removeSelectedLogo if called or implicitly if form resets
    }
    
    toast({
      title: 'Settings Saved',
      description: 'Your configuration has been updated locally.',
    });
  };

  if (!isClient) {
    // Skeleton loader for SSR/initial render
    return (
        <div className="space-y-6">
          <Card className="w-full max-w-2xl mx-auto shadow-lg animate-pulse">
            <CardHeader>
              <CardTitle className="h-8 bg-muted rounded"></CardTitle>
              <CardDescription className="h-4 bg-muted rounded mt-1"></CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Preferences Skeleton */}
              <div>
                <div className="h-6 bg-muted rounded w-1/4 mb-2"></div>
                <div className="space-y-2">
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                </div>
              </div>
              {/* Logo Skeleton */}
              <div>
                <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
                 <div className="h-20 bg-muted rounded mt-2"></div>
              </div>
              {/* n8n Skeleton */}
              <div>
                <div className="h-6 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
              {/* SMTP Skeleton */}
              <div>
                <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-muted rounded mb-4"></div>
                <div className="h-10 bg-muted rounded mb-4"></div>
                <div className="h-10 bg-muted rounded mb-4"></div>
                <div className="h-10 bg-muted rounded"></div>
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
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-6 w-6 text-primary" /> Application Settings
          </CardTitle>
          <CardDescription>Manage integrations, preferences, and other application settings. Settings are saved locally in your browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preferences Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Palette className="mr-2 h-5 w-5 text-primary" /> Preferences
            </h3>
            <div className="space-y-2">
              <Label>Theme</Label>
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
              <p className="text-xs text-muted-foreground">
                Note: This theme preference is visual only for this prototype. Actual theme switching is handled by the header toggle.
              </p>
            </div>
          </section>

          {/* App Logo Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <ImageUp className="mr-2 h-5 w-5 text-primary" /> App Logo
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
              {selectedLogoFile && logoPreviewUrl && (
                <div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3 bg-muted/50">
                  <img src={logoPreviewUrl} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                  <span className="text-sm text-foreground truncate max-w-xs">{selectedLogoFile.name}</span>
                  <Button variant="ghost" size="icon" onClick={removeSelectedLogo} className="h-7 w-7">
                    <Trash2 className="h-4 w-4 text-destructive"/>
                    <span className="sr-only">Remove selected logo</span>
                  </Button>
                </div>
              )}
              {savedLogoFilename && !selectedLogoFile && (
                 <p className="text-sm text-muted-foreground mt-1">
                  Current conceptually "saved" logo: <strong>{savedLogoFilename}</strong>. Select a new file to change.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Select an image to replace the application logo (conceptual for this prototype).
              </p>
            </div>
          </section>
          
          {/* n8n Webhook Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">Workflow Automation (n8n)</h3>
            <div>
              <Label htmlFor="n8n-webhook-url">n8n Webhook URL</Label>
              <Input
                id="n8n-webhook-url"
                type="url"
                placeholder="https://your-n8n-instance.com/webhook/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the full URL for your n8n webhook to process resume uploads.
              </p>
            </div>
          </section>

          {/* SMTP Configuration Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Mail className="mr-2 h-5 w-5 text-primary" /> SMTP Configuration (for Email Sending)
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  type="text"
                  placeholder="smtp.example.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="smtp-user">SMTP Username</Label>
                <Input
                  id="smtp-user"
                  type="text"
                  placeholder="your-email@example.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="smtp-password">SMTP Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  placeholder="••••••••"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="mt-1"
                />
                 <p className="text-xs text-muted-foreground mt-1">
                  Note: Password is not saved in this prototype. Use environment variables in production.
                </p>
              </div>
            </div>
             <p className="text-sm text-muted-foreground mt-2">
                These settings would be used by the application to send emails (e.g., notifications, alerts). In a production environment, store these securely, typically using environment variables.
              </p>
          </section>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save All Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
