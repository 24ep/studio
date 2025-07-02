import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, X } from 'lucide-react';
import type { SystemSetting } from "@/lib/types";

interface SystemSettingsFormProps {
  open: boolean;
  setting: SystemSetting | null;
  onClose: () => void;
  onSubmit: (data: SystemSetting[]) => void;
  isSaving?: boolean;
}

// Allowed system setting keys (must match backend systemSettingKeyEnum)
const ALLOWED_SYSTEM_SETTING_KEYS = [
  'appName', 'appLogoDataUrl', 'appThemePreference',
  'primaryGradientStart', 'primaryGradientEnd',
  'smtpHost', 'smtpPort', 'smtpUser', 'smtpSecure', 'smtpFromEmail',
  'generalPdfWebhookUrl', 'geminiApiKey',
  'loginPageBackgroundType', 'loginPageBackgroundImageUrl', 
  'loginPageBackgroundColor1', 'loginPageBackgroundColor2',
  'loginPageLayoutType',
  // Sidebar Light Theme
  'sidebarBgStartL', 'sidebarBgEndL', 'sidebarTextL',
  'sidebarActiveBgStartL', 'sidebarActiveBgEndL', 'sidebarActiveTextL',
  'sidebarHoverBgL', 'sidebarHoverTextL', 'sidebarBorderL',
  // Sidebar Dark Theme
  'sidebarBgStartD', 'sidebarBgEndD', 'sidebarTextD',
  'sidebarActiveBgStartD', 'sidebarActiveBgEndD', 'sidebarActiveTextD',
  'sidebarHoverBgD', 'sidebarHoverTextD', 'sidebarBorderD',
  'appFontFamily',
  'loginPageContent',
  'maxConcurrentProcessors',
];

const SystemSettingsForm: React.FC<SystemSettingsFormProps> = ({ 
  open, 
  setting, 
  onClose, 
  onSubmit, 
  isSaving = false 
}) => {
  const [formData, setFormData] = useState<SystemSetting>({
    key: 'appName',
    value: null
  });

  useEffect(() => {
    if (setting) {
      setFormData(setting);
    } else {
      setFormData({ key: 'appName', value: null });
    }
  }, [setting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.key.trim()) {
      // Always send value as string or null
      const safeValue = formData.value === null || formData.value === undefined ? null : String(formData.value);
      onSubmit([{ ...formData, value: safeValue }]);
    }
  };

  const handleInputChange = (field: keyof SystemSetting, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {setting ? 'Edit System Setting' : 'Add System Setting'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Setting Key</Label>
            {setting ? (
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => handleInputChange('key', e.target.value)}
                placeholder="e.g., appName, smtpHost"
                disabled={!!setting} // Can't edit key for existing settings
                required
              />
            ) : (
              <Select
                value={formData.key}
                onValueChange={(value) => handleInputChange('key', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select setting key" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_SYSTEM_SETTING_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            {formData.key.includes('Url') || formData.key.includes('webhook') ? (
              <Textarea
                id="value"
                value={formData.value || ''}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder="Enter URL or webhook endpoint"
                rows={3}
              />
            ) : formData.key.includes('ApiKey') || formData.key.includes('Secret') ? (
              <Input
                id="value"
                type="password"
                value={formData.value || ''}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder="Enter API key or secret"
              />
            ) : formData.key.includes('Port') ? (
              <Input
                id="value"
                type="number"
                value={formData.value || ''}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder="Enter port number"
              />
            ) : formData.key.includes('Secure') || formData.key.includes('Required') ? (
              <Select
                value={formData.value || ''}
                onValueChange={(value) => handleInputChange('value', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : formData.key.startsWith('sidebar') && (formData.key.includes('Bg') || formData.key.includes('Text') || formData.key.includes('Border')) ? (
              <div className="flex items-center gap-2">
                <Input
                  id="value"
                  value={formData.value || ''}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  placeholder="e.g., 220 25% 97% (HSL values)"
                />
                <input
                  type="color"
                  value={formData.value ? `hsl(${formData.value})` : '#ffffff'}
                  onChange={(e) => {
                    // Convert hex to HSL
                    const hex = e.target.value;
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

                    const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
                    handleInputChange('value', hsl);
                  }}
                  className="w-12 h-10 rounded border"
                />
              </div>
            ) : (
              <Input
                id="value"
                value={formData.value || ''}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder="Enter value"
              />
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !formData.key.trim()}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SystemSettingsForm; 