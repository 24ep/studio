import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, X } from 'lucide-react';

interface SystemSetting {
  key: string;
  value: string | null;
  updatedAt?: string;
}

interface SystemSettingsFormProps {
  open: boolean;
  setting: SystemSetting | null;
  onClose: () => void;
  onSubmit: (data: SystemSetting[]) => void;
  isSaving?: boolean;
}

const SystemSettingsForm: React.FC<SystemSettingsFormProps> = ({ 
  open, 
  setting, 
  onClose, 
  onSubmit, 
  isSaving = false 
}) => {
  const [formData, setFormData] = useState<SystemSetting>({
    key: '',
    value: null
  });

  useEffect(() => {
    if (setting) {
      setFormData(setting);
    } else {
      setFormData({ key: '', value: null });
    }
  }, [setting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.key.trim()) {
      onSubmit([formData]);
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
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => handleInputChange('key', e.target.value)}
              placeholder="e.g., appName, smtpHost"
              disabled={!!setting} // Can't edit key for existing settings
              required
            />
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