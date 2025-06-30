"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, 
  Type, 
  BorderAll, 
  Shadow, 
  Layout, 
  MousePointer, 
  Image as ImageIcon,
  RotateCcw,
  Sun,
  Moon,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarCustomizationProps {
  onSave: (settings: Record<string, string>) => void;
  initialSettings?: Record<string, string>;
  disabled?: boolean;
}

// Default sidebar settings
const DEFAULT_SIDEBAR_SETTINGS = {
  // Background colors - Light
  'sidebar-background-start': '220 25% 97%',
  'sidebar-background-end': '220 20% 94%',
  'sidebar-foreground': '220 25% 30%',
  'sidebar-border': '220 15% 85%',
  'sidebar-primary': '179 67% 66%',
  'sidebar-primary-foreground': '0 0% 100%',
  'sidebar-accent': '220 10% 92%',
  'sidebar-accent-foreground': '220 25% 25%',
  
  // Background colors - Dark
  'sidebar-background-start-dark': '220 15% 12%',
  'sidebar-background-end-dark': '220 15% 9%',
  'sidebar-foreground-dark': '210 30% 85%',
  'sidebar-border-dark': '220 15% 18%',
  'sidebar-primary-dark': '179 67% 66%',
  'sidebar-primary-foreground-dark': '0 0% 100%',
  'sidebar-accent-dark': '220 15% 20%',
  'sidebar-accent-foreground-dark': '210 30% 90%',
  
  // Font settings
  'sidebar-font-family': 'inherit',
  'sidebar-font-size': '0.875rem',
  'sidebar-font-weight': '400',
  'sidebar-line-height': '1.25rem',
  'sidebar-letter-spacing': '0',
  'sidebar-text-transform': 'none',
  
  // Border and shadow settings
  'sidebar-border-width': '1px',
  'sidebar-border-style': 'solid',
  'sidebar-border-radius': '0.5rem',
  'sidebar-shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'sidebar-shadow-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'sidebar-shadow-active': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  
  // Spacing and layout
  'sidebar-padding-x': '0.75rem',
  'sidebar-padding-y': '0.5rem',
  'sidebar-margin': '0.25rem',
  'sidebar-gap': '0.5rem',
  'sidebar-width': '16rem',
  'sidebar-width-collapsed': '3rem',
  'sidebar-transition-duration': '0.2s',
  'sidebar-transition-timing': 'ease-in-out',
  
  // Menu item specific settings
  'sidebar-menu-item-background': 'transparent',
  'sidebar-menu-item-background-hover': '220 10% 92%',
  'sidebar-menu-item-background-active': '179 67% 66%',
  'sidebar-menu-item-color': '220 25% 30%',
  'sidebar-menu-item-color-hover': '220 25% 25%',
  'sidebar-menu-item-color-active': '0 0% 100%',
  'sidebar-menu-item-border': 'transparent',
  'sidebar-menu-item-border-hover': 'transparent',
  'sidebar-menu-item-border-active': 'transparent',
  'sidebar-menu-item-border-radius': '0.375rem',
  'sidebar-menu-item-padding-x': '0.75rem',
  'sidebar-menu-item-padding-y': '0.5rem',
  'sidebar-menu-item-margin': '0.125rem',
  'sidebar-menu-item-font-weight': '400',
  'sidebar-menu-item-font-weight-active': '600',
  'sidebar-menu-item-font-size': '0.875rem',
  'sidebar-menu-item-line-height': '1.25rem',
  'sidebar-menu-item-transition': 'all 0.2s ease-in-out',
  
  // Icon settings
  'sidebar-icon-size': '1.25rem',
  'sidebar-icon-color': '220 25% 30%',
  'sidebar-icon-color-hover': '220 25% 25%',
  'sidebar-icon-color-active': '0 0% 100%',
  'sidebar-icon-margin-right': '0.75rem',
  'sidebar-icon-transition': 'color 0.2s ease-in-out',
  
  // Group label settings
  'sidebar-group-label-color': '220 15% 50%',
  'sidebar-group-label-font-size': '0.75rem',
  'sidebar-group-label-font-weight': '500',
  'sidebar-group-label-text-transform': 'uppercase',
  'sidebar-group-label-letter-spacing': '0.05em',
  'sidebar-group-label-padding': '0.5rem 0.75rem',
  'sidebar-group-label-margin': '0.5rem 0',
};

// Helper functions
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hslString: string): string {
  const match = hslString.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!match) return '#000000';
  
  const h = parseInt(match[1]);
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ComprehensiveSidebarCustomization({ 
  onSave, 
  initialSettings = {}, 
  disabled = false 
}: SidebarCustomizationProps) {
  const [settings, setSettings] = useState<Record<string, string>>({
    ...DEFAULT_SIDEBAR_SETTINGS,
    ...initialSettings
  });

  // Apply settings to CSS variables
  useEffect(() => {
    Object.entries(settings).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  }, [settings]);

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SIDEBAR_SETTINGS);
  };

  const handleSave = () => {
    onSave(settings);
  };

  const renderColorInput = (key: string, label: string, placeholder?: string) => (
    <div className="space-y-2">
      <Label htmlFor={key} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={key}
          type="text"
          value={settings[key] || ''}
          onChange={(e) => updateSetting(key, e.target.value)}
          placeholder={placeholder || "220 25% 97%"}
          className="text-sm"
          disabled={disabled}
        />
        <Input
          type="color"
          value={hslToHex(settings[key] || '0 0% 100%')}
          onChange={(e) => updateSetting(key, hexToHsl(e.target.value))}
          className="w-10 h-9 p-1 rounded-md border"
          disabled={disabled}
        />
      </div>
    </div>
  );

  const renderTextInput = (key: string, label: string, placeholder?: string) => (
    <div className="space-y-2">
      <Label htmlFor={key} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={key}
        type="text"
        value={settings[key] || ''}
        onChange={(e) => updateSetting(key, e.target.value)}
        placeholder={placeholder}
        className="text-sm"
        disabled={disabled}
      />
    </div>
  );

  const renderSelect = (key: string, label: string, options: { value: string; label: string }[]) => (
    <div className="space-y-2">
      <Label htmlFor={key} className="text-sm font-medium">
        {label}
      </Label>
      <Select value={settings[key] || ''} onValueChange={(value) => updateSetting(key, value)} disabled={disabled}>
        <SelectTrigger className="text-sm">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Comprehensive Sidebar Customization
          </CardTitle>
          <CardDescription>
            Customize every aspect of your sidebar including colors, fonts, borders, shadows, spacing, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="fonts" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Fonts
              </TabsTrigger>
              <TabsTrigger value="borders" className="flex items-center gap-2">
                <BorderAll className="h-4 w-4" />
                Borders
              </TabsTrigger>
              <TabsTrigger value="shadows" className="flex items-center gap-2">
                <Shadow className="h-4 w-4" />
                Shadows
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="interactions" className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Interactions
              </TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light Theme Colors
                  </h4>
                  {renderColorInput('sidebar-background-start', 'Background Start')}
                  {renderColorInput('sidebar-background-end', 'Background End')}
                  {renderColorInput('sidebar-foreground', 'Text Color')}
                  {renderColorInput('sidebar-border', 'Border Color')}
                  {renderColorInput('sidebar-primary', 'Primary Color')}
                  {renderColorInput('sidebar-primary-foreground', 'Primary Text')}
                  {renderColorInput('sidebar-accent', 'Accent Color')}
                  {renderColorInput('sidebar-accent-foreground', 'Accent Text')}
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark Theme Colors
                  </h4>
                  {renderColorInput('sidebar-background-start-dark', 'Background Start')}
                  {renderColorInput('sidebar-background-end-dark', 'Background End')}
                  {renderColorInput('sidebar-foreground-dark', 'Text Color')}
                  {renderColorInput('sidebar-border-dark', 'Border Color')}
                  {renderColorInput('sidebar-primary-dark', 'Primary Color')}
                  {renderColorInput('sidebar-primary-foreground-dark', 'Primary Text')}
                  {renderColorInput('sidebar-accent-dark', 'Accent Color')}
                  {renderColorInput('sidebar-accent-foreground-dark', 'Accent Text')}
                </div>
              </div>
            </TabsContent>

            {/* Fonts Tab */}
            <TabsContent value="fonts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Typography Settings</h4>
                  {renderSelect('sidebar-font-family', 'Font Family', [
                    { value: 'inherit', label: 'Inherit' },
                    { value: 'system-ui', label: 'System UI' },
                    { value: 'Arial', label: 'Arial' },
                    { value: 'Helvetica', label: 'Helvetica' },
                    { value: 'Georgia', label: 'Georgia' },
                    { value: 'Times New Roman', label: 'Times New Roman' },
                  ])}
                  {renderTextInput('sidebar-font-size', 'Font Size', '0.875rem')}
                  {renderSelect('sidebar-font-weight', 'Font Weight', [
                    { value: '100', label: 'Thin (100)' },
                    { value: '200', label: 'Extra Light (200)' },
                    { value: '300', label: 'Light (300)' },
                    { value: '400', label: 'Normal (400)' },
                    { value: '500', label: 'Medium (500)' },
                    { value: '600', label: 'Semi Bold (600)' },
                    { value: '700', label: 'Bold (700)' },
                    { value: '800', label: 'Extra Bold (800)' },
                    { value: '900', label: 'Black (900)' },
                  ])}
                  {renderTextInput('sidebar-line-height', 'Line Height', '1.25rem')}
                  {renderTextInput('sidebar-letter-spacing', 'Letter Spacing', '0')}
                  {renderSelect('sidebar-text-transform', 'Text Transform', [
                    { value: 'none', label: 'None' },
                    { value: 'uppercase', label: 'Uppercase' },
                    { value: 'lowercase', label: 'Lowercase' },
                    { value: 'capitalize', label: 'Capitalize' },
                  ])}
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Menu Item Typography</h4>
                  {renderTextInput('sidebar-menu-item-font-size', 'Menu Item Font Size', '0.875rem')}
                  {renderSelect('sidebar-menu-item-font-weight', 'Menu Item Font Weight', [
                    { value: '400', label: 'Normal (400)' },
                    { value: '500', label: 'Medium (500)' },
                    { value: '600', label: 'Semi Bold (600)' },
                    { value: '700', label: 'Bold (700)' },
                  ])}
                  {renderSelect('sidebar-menu-item-font-weight-active', 'Active Item Font Weight', [
                    { value: '500', label: 'Medium (500)' },
                    { value: '600', label: 'Semi Bold (600)' },
                    { value: '700', label: 'Bold (700)' },
                    { value: '800', label: 'Extra Bold (800)' },
                  ])}
                  {renderTextInput('sidebar-menu-item-line-height', 'Menu Item Line Height', '1.25rem')}
                  
                  <Separator />
                  
                  <h4 className="text-lg font-semibold">Group Label Typography</h4>
                  {renderTextInput('sidebar-group-label-font-size', 'Group Label Font Size', '0.75rem')}
                  {renderSelect('sidebar-group-label-font-weight', 'Group Label Font Weight', [
                    { value: '400', label: 'Normal (400)' },
                    { value: '500', label: 'Medium (500)' },
                    { value: '600', label: 'Semi Bold (600)' },
                    { value: '700', label: 'Bold (700)' },
                  ])}
                  {renderSelect('sidebar-group-label-text-transform', 'Group Label Text Transform', [
                    { value: 'none', label: 'None' },
                    { value: 'uppercase', label: 'Uppercase' },
                    { value: 'lowercase', label: 'Lowercase' },
                    { value: 'capitalize', label: 'Capitalize' },
                  ])}
                  {renderTextInput('sidebar-group-label-letter-spacing', 'Group Label Letter Spacing', '0.05em')}
                </div>
              </div>
            </TabsContent>

            {/* Borders Tab */}
            <TabsContent value="borders" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Sidebar Borders</h4>
                  {renderTextInput('sidebar-border-width', 'Border Width', '1px')}
                  {renderSelect('sidebar-border-style', 'Border Style', [
                    { value: 'solid', label: 'Solid' },
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' },
                    { value: 'double', label: 'Double' },
                    { value: 'none', label: 'None' },
                  ])}
                  {renderTextInput('sidebar-border-radius', 'Border Radius', '0.5rem')}
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Menu Item Borders</h4>
                  {renderTextInput('sidebar-menu-item-border-radius', 'Menu Item Border Radius', '0.375rem')}
                  {renderColorInput('sidebar-menu-item-border', 'Menu Item Border')}
                  {renderColorInput('sidebar-menu-item-border-hover', 'Menu Item Border (Hover)')}
                  {renderColorInput('sidebar-menu-item-border-active', 'Menu Item Border (Active)')}
                </div>
              </div>
            </TabsContent>

            {/* Shadows Tab */}
            <TabsContent value="shadows" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Sidebar Shadows</h4>
                  {renderTextInput('sidebar-shadow', 'Default Shadow', '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)')}
                  {renderTextInput('sidebar-shadow-hover', 'Hover Shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)')}
                  {renderTextInput('sidebar-shadow-active', 'Active Shadow', '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)')}
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Shadow Examples</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>None:</strong> none</p>
                    <p><strong>Small:</strong> 0 1px 2px 0 rgb(0 0 0 / 0.05)</p>
                    <p><strong>Medium:</strong> 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)</p>
                    <p><strong>Large:</strong> 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)</p>
                    <p><strong>Extra Large:</strong> 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Spacing & Layout</h4>
                  {renderTextInput('sidebar-padding-x', 'Horizontal Padding', '0.75rem')}
                  {renderTextInput('sidebar-padding-y', 'Vertical Padding', '0.5rem')}
                  {renderTextInput('sidebar-margin', 'Margin', '0.25rem')}
                  {renderTextInput('sidebar-gap', 'Gap', '0.5rem')}
                  {renderTextInput('sidebar-width', 'Sidebar Width', '16rem')}
                  {renderTextInput('sidebar-width-collapsed', 'Collapsed Width', '3rem')}
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Menu Item Spacing</h4>
                  {renderTextInput('sidebar-menu-item-padding-x', 'Menu Item Horizontal Padding', '0.75rem')}
                  {renderTextInput('sidebar-menu-item-padding-y', 'Menu Item Vertical Padding', '0.5rem')}
                  {renderTextInput('sidebar-menu-item-margin', 'Menu Item Margin', '0.125rem')}
                  
                  <Separator />
                  
                  <h4 className="text-lg font-semibold">Group Label Spacing</h4>
                  {renderTextInput('sidebar-group-label-padding', 'Group Label Padding', '0.5rem 0.75rem')}
                  {renderTextInput('sidebar-group-label-margin', 'Group Label Margin', '0.5rem 0')}
                  
                  <Separator />
                  
                  <h4 className="text-lg font-semibold">Icon Spacing</h4>
                  {renderTextInput('sidebar-icon-size', 'Icon Size', '1.25rem')}
                  {renderTextInput('sidebar-icon-margin-right', 'Icon Right Margin', '0.75rem')}
                </div>
              </div>
            </TabsContent>

            {/* Interactions Tab */}
            <TabsContent value="interactions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Transitions</h4>
                  {renderTextInput('sidebar-transition-duration', 'Transition Duration', '0.2s')}
                  {renderSelect('sidebar-transition-timing', 'Transition Timing', [
                    { value: 'ease', label: 'Ease' },
                    { value: 'ease-in', label: 'Ease In' },
                    { value: 'ease-out', label: 'Ease Out' },
                    { value: 'ease-in-out', label: 'Ease In Out' },
                    { value: 'linear', label: 'Linear' },
                  ])}
                  {renderTextInput('sidebar-menu-item-transition', 'Menu Item Transition', 'all 0.2s ease-in-out')}
                  {renderTextInput('sidebar-icon-transition', 'Icon Transition', 'color 0.2s ease-in-out')}
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Menu Item States</h4>
                  {renderColorInput('sidebar-menu-item-background', 'Default Background')}
                  {renderColorInput('sidebar-menu-item-background-hover', 'Hover Background')}
                  {renderColorInput('sidebar-menu-item-background-active', 'Active Background')}
                  {renderColorInput('sidebar-menu-item-color', 'Default Text Color')}
                  {renderColorInput('sidebar-menu-item-color-hover', 'Hover Text Color')}
                  {renderColorInput('sidebar-menu-item-color-active', 'Active Text Color')}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={resetSettings} disabled={disabled}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
              <Badge variant="secondary">
                {Object.keys(settings).length} settings configured
              </Badge>
            </div>
            
            <Button onClick={handleSave} disabled={disabled}>
              <Save className="mr-2 h-4 w-4" />
              Save Sidebar Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 