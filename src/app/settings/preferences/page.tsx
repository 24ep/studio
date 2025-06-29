"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Loader2, 
  ServerCrash, 
  Sidebar, 
  LogIn, 
  Image as ImageIcon,
  Gradient,
  Type,
  Layout,
  Save,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import type { SystemSetting, LoginPageBackgroundType, LoginPageLayoutType } from '@/lib/types';
import { ImageUpload } from '@/components/ui/image-upload';

interface SystemSettings {
  appName?: string;
  appLogoDataUrl?: string;
  appThemePreference?: string;
  primaryGradientStart?: string;
  primaryGradientEnd?: string;
  // Sidebar Light Theme
  sidebarBgStartL?: string;
  sidebarBgEndL?: string;
  sidebarTextL?: string;
  sidebarActiveBgStartL?: string;
  sidebarActiveBgEndL?: string;
  sidebarActiveTextL?: string;
  sidebarHoverBgL?: string;
  sidebarHoverTextL?: string;
  sidebarBorderL?: string;
  // Sidebar Dark Theme
  sidebarBgStartD?: string;
  sidebarBgEndD?: string;
  sidebarTextD?: string;
  sidebarActiveBgStartD?: string;
  sidebarActiveBgEndD?: string;
  sidebarActiveTextD?: string;
  sidebarHoverBgD?: string;
  sidebarHoverTextD?: string;
  sidebarBorderD?: string;
  // Login Page
  loginPageBackgroundType?: LoginPageBackgroundType;
  loginPageBackgroundImageUrl?: string;
  loginPageBackgroundColor1?: string;
  loginPageBackgroundColor2?: string;
  loginPageLayoutType?: LoginPageLayoutType;
  loginPageContent?: string;
}

export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<SystemSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('appearance');

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/system-settings');
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setSettings(data);
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch settings';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching settings:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status, fetchSettings]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSaveSettings = async (newSettings: Partial<SystemSettings>) => {
    setIsSaving(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      const settingsArray = Object.entries(updatedSettings).map(([key, value]) => ({
        key,
        value: value || null
      }));

      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsArray),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSettings(updatedSettings);
      toast.success('Settings saved successfully');
      
      // Trigger app config change event
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('appConfigChanged', {
          detail: {
            appName: updatedSettings.appName,
            logoUrl: updatedSettings.appLogoDataUrl,
            themePreference: updatedSettings.appThemePreference,
            primaryGradientStart: updatedSettings.primaryGradientStart,
            primaryGradientEnd: updatedSettings.primaryGradientEnd,
            sidebarColors: Object.entries(updatedSettings).reduce((acc, [key, value]) => {
              if (key.startsWith('sidebar') && value) {
                acc[key] = value;
              }
              return acc;
            }, {} as Record<string, string>)
          }
        });
        window.dispatchEvent(event);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const ColorSwatch = ({ color, onChange, label }: { color: string; onChange: (color: string) => void; label: string }) => {
    // Ensure color is a valid hex or fallback
    const safeColor = /^#([0-9A-F]{3}){1,2}$/i.test(color) ? color : (color?.startsWith('#') ? color : `#${color.replace(/[^0-9A-F]/gi, '').slice(0, 6)}`) || '#ffffff';
    return (
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-8 p-0 border-2"
              style={{ backgroundColor: safeColor }}
            >
              <span className="sr-only">{label}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <Label>{label}</Label>
              <Input
                type="color"
                value={safeColor}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10"
              />
              <Input
                value={safeColor}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Hex color code"
              />
            </div>
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    );
  };

  const SidebarSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Light Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Background Start</Label>
            <ColorSwatch
              color={settings.sidebarBgStartL || '#f8fafc'}
              onChange={(color) => handleSaveSettings({ sidebarBgStartL: color })}
              label="Background Start"
            />
          </div>
          <div className="space-y-2">
            <Label>Background End</Label>
            <ColorSwatch
              color={settings.sidebarBgEndL || '#f1f5f9'}
              onChange={(color) => handleSaveSettings({ sidebarBgEndL: color })}
              label="Background End"
            />
          </div>
          <div className="space-y-2">
            <Label>Text Color</Label>
            <ColorSwatch
              color={settings.sidebarTextL || '#475569'}
              onChange={(color) => handleSaveSettings({ sidebarTextL: color })}
              label="Text Color"
            />
          </div>
          <div className="space-y-2">
            <Label>Border Color</Label>
            <ColorSwatch
              color={settings.sidebarBorderL || '#e2e8f0'}
              onChange={(color) => handleSaveSettings({ sidebarBorderL: color })}
              label="Border Color"
            />
          </div>
          <div className="space-y-2">
            <Label>Active Background Start</Label>
            <ColorSwatch
              color={settings.sidebarActiveBgStartL || '#0ea5e9'}
              onChange={(color) => handleSaveSettings({ sidebarActiveBgStartL: color })}
              label="Active Background Start"
            />
          </div>
          <div className="space-y-2">
            <Label>Active Background End</Label>
            <ColorSwatch
              color={settings.sidebarActiveBgEndL || '#0284c7'}
              onChange={(color) => handleSaveSettings({ sidebarActiveBgEndL: color })}
              label="Active Background End"
            />
          </div>
          <div className="space-y-2">
            <Label>Active Text Color</Label>
            <ColorSwatch
              color={settings.sidebarActiveTextL || '#ffffff'}
              onChange={(color) => handleSaveSettings({ sidebarActiveTextL: color })}
              label="Active Text Color"
            />
          </div>
          <div className="space-y-2">
            <Label>Hover Background</Label>
            <ColorSwatch
              color={settings.sidebarHoverBgL || '#f1f5f9'}
              onChange={(color) => handleSaveSettings({ sidebarHoverBgL: color })}
              label="Hover Background"
            />
          </div>
          <div className="space-y-2">
            <Label>Hover Text Color</Label>
            <ColorSwatch
              color={settings.sidebarHoverTextL || '#334155'}
              onChange={(color) => handleSaveSettings({ sidebarHoverTextL: color })}
              label="Hover Text Color"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Dark Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Background Start</Label>
            <ColorSwatch
              color={settings.sidebarBgStartD || '#1e293b'}
              onChange={(color) => handleSaveSettings({ sidebarBgStartD: color })}
              label="Background Start"
            />
          </div>
          <div className="space-y-2">
            <Label>Background End</Label>
            <ColorSwatch
              color={settings.sidebarBgEndD || '#334155'}
              onChange={(color) => handleSaveSettings({ sidebarBgEndD: color })}
              label="Background End"
            />
          </div>
          <div className="space-y-2">
            <Label>Text Color</Label>
            <ColorSwatch
              color={settings.sidebarTextD || '#cbd5e1'}
              onChange={(color) => handleSaveSettings({ sidebarTextD: color })}
              label="Text Color"
            />
          </div>
          <div className="space-y-2">
            <Label>Border Color</Label>
            <ColorSwatch
              color={settings.sidebarBorderD || '#475569'}
              onChange={(color) => handleSaveSettings({ sidebarBorderD: color })}
              label="Border Color"
            />
          </div>
          <div className="space-y-2">
            <Label>Active Background Start</Label>
            <ColorSwatch
              color={settings.sidebarActiveBgStartD || '#0ea5e9'}
              onChange={(color) => handleSaveSettings({ sidebarActiveBgStartD: color })}
              label="Active Background Start"
            />
          </div>
          <div className="space-y-2">
            <Label>Active Background End</Label>
            <ColorSwatch
              color={settings.sidebarActiveBgEndD || '#0284c7'}
              onChange={(color) => handleSaveSettings({ sidebarActiveBgEndD: color })}
              label="Active Background End"
            />
          </div>
          <div className="space-y-2">
            <Label>Active Text Color</Label>
            <ColorSwatch
              color={settings.sidebarActiveTextD || '#ffffff'}
              onChange={(color) => handleSaveSettings({ sidebarActiveTextD: color })}
              label="Active Text Color"
            />
          </div>
          <div className="space-y-2">
            <Label>Hover Background</Label>
            <ColorSwatch
              color={settings.sidebarHoverBgD || '#334155'}
              onChange={(color) => handleSaveSettings({ sidebarHoverBgD: color })}
              label="Hover Background"
            />
          </div>
          <div className="space-y-2">
            <Label>Hover Text Color</Label>
            <ColorSwatch
              color={settings.sidebarHoverTextD || '#e2e8f0'}
              onChange={(color) => handleSaveSettings({ sidebarHoverTextD: color })}
              label="Hover Text Color"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const LoginPageSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Layout</h3>
        <div className="flex gap-4 items-center">
          <Label>Layout Type</Label>
          <Select
            value={settings.loginPageLayoutType || 'center'}
            onValueChange={(value: LoginPageLayoutType) => handleSaveSettings({ loginPageLayoutType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="center">Centered Login Box</SelectItem>
              <SelectItem value="2column">Two Column (Login on Right)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Background</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Background Type</Label>
            <Select
              value={settings.loginPageBackgroundType || 'default'}
              onValueChange={(value: LoginPageBackgroundType) => handleSaveSettings({ loginPageBackgroundType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select background type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="color">Solid Color</SelectItem>
                <SelectItem value="gradient">Custom Gradient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.loginPageBackgroundType === 'image' && (
            <ImageUpload
              value={settings.loginPageBackgroundImageUrl || ''}
              onChange={(value) => handleSaveSettings({ loginPageBackgroundImageUrl: value })}
              label="Background Image"
              placeholder="Enter image URL or upload image file"
              previewSize="lg"
              allowUrl={true}
              allowFile={true}
            />
          )}

          {settings.loginPageBackgroundType === 'color' && (
            <div className="space-y-2">
              <Label>Background Color</Label>
              <ColorSwatch
                color={settings.loginPageBackgroundColor1 || '#ffffff'}
                onChange={(color) => handleSaveSettings({ loginPageBackgroundColor1: color })}
                label="Background Color"
              />
            </div>
          )}

          {settings.loginPageBackgroundType === 'gradient' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Gradient Start Color</Label>
                <ColorSwatch
                  color={settings.loginPageBackgroundColor1 || '#667eea'}
                  onChange={(color) => handleSaveSettings({ loginPageBackgroundColor1: color })}
                  label="Gradient Start"
                />
              </div>
              <div className="space-y-2">
                <Label>Gradient End Color</Label>
                <ColorSwatch
                  color={settings.loginPageBackgroundColor2 || '#764ba2'}
                  onChange={(color) => handleSaveSettings({ loginPageBackgroundColor2: color })}
                  label="Gradient End"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Content</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Custom Content (HTML)</Label>
            <Textarea
              value={settings.loginPageContent || ''}
              onChange={(e) => handleSaveSettings({ loginPageContent: e.target.value })}
              placeholder="Enter custom HTML content for the login page..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              This content will be displayed above the login form. You can use HTML tags for formatting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const AppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Application</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Application Name</Label>
            <Input
              value={settings.appName || 'CandiTrack'}
              onChange={(e) => handleSaveSettings({ appName: e.target.value })}
              placeholder="Enter application name"
            />
          </div>
          <div className="space-y-2">
            <Label>Theme Preference</Label>
            <Select
              value={settings.appThemePreference || 'system'}
              onValueChange={(value) => handleSaveSettings({ appThemePreference: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Primary Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary Gradient Start</Label>
            <ColorSwatch
              color={settings.primaryGradientStart || '#0ea5e9'}
              onChange={(color) => handleSaveSettings({ primaryGradientStart: color })}
              label="Primary Start"
            />
          </div>
          <div className="space-y-2">
            <Label>Primary Gradient End</Label>
            <ColorSwatch
              color={settings.primaryGradientEnd || '#3b82f6'}
              onChange={(color) => handleSaveSettings({ primaryGradientEnd: color })}
              label="Primary End"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Logo</h3>
        <ImageUpload
          value={settings.appLogoDataUrl || ''}
          onChange={(value) => handleSaveSettings({ appLogoDataUrl: value })}
          label="Application Logo"
          placeholder="Enter logo URL or upload image file"
          previewSize="md"
          allowUrl={true}
          allowFile={true}
        />
      </div>
    </div>
  );

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Settings</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={fetchSettings} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Palette className="mr-3 h-6 w-6 text-primary" /> Application Preferences
          </CardTitle>
          <CardDescription>
            Customize the appearance and behavior of your application, including sidebar colors, login page design, and branding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="sidebar" className="flex items-center gap-2">
                <Sidebar className="h-4 w-4" />
                Sidebar
              </TabsTrigger>
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login Page
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="mt-6">
              <AppearanceSettings />
            </TabsContent>

            <TabsContent value="sidebar" className="mt-6">
              <SidebarSettings />
            </TabsContent>

            <TabsContent value="login" className="mt-6">
              <LoginPageSettings />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6 pt-6 border-t">
            <Button 
              onClick={() => fetchSettings()} 
              disabled={isSaving}
              className="btn-primary-gradient"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 