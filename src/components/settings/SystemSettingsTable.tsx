import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Settings } from 'lucide-react';
import type { SystemSetting } from "@/lib/types";

interface SystemSettingsTableProps {
  settings: SystemSetting[];
  isLoading: boolean;
  onEdit: (setting: SystemSetting) => void;
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

const SystemSettingsTable: React.FC<SystemSettingsTableProps> = ({ settings, isLoading, onEdit }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter settings to only allowed keys
  const filteredSettings = settings.filter(setting => ALLOWED_SYSTEM_SETTING_KEYS.includes(setting.key));

  if (!filteredSettings || filteredSettings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">No settings found</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to safely render values
  const renderValue = (value: string | null): string => {
    if (value === null || value === undefined) {
      return 'Not set';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Helper function to get setting category
  const getSettingCategory = (key: string): string => {
    if (key.startsWith('app')) return 'Application';
    if (key.startsWith('smtp')) return 'Email';
    if (key.startsWith('login')) return 'Login Page';
    if (key.startsWith('sidebar')) return 'Sidebar';
    if (key.includes('Webhook') || key.includes('Url')) return 'Webhooks';
    if (key.includes('ApiKey') || key.includes('Key')) return 'API Keys';
    return 'General';
  };

  // Group settings by category
  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    const category = getSettingCategory(setting.key);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {category} Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorySettings.map((setting) => (
                  <TableRow key={setting.key}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{setting.key}</span>
                        {setting.value === null && (
                          <Badge variant="secondary" className="text-xs">
                            Not Set
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md truncate" title={renderValue(setting.value)}>
                        {renderValue(setting.value)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(setting)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SystemSettingsTable; 