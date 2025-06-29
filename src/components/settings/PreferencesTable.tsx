import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Palette, Settings, Loader2 } from 'lucide-react';
import type { UserDataModelPreference } from '@/lib/types';

interface UserPreference {
  id: string;
  userId: string;
  key: string;
  value: string;
  modelType?: 'Candidate' | 'Position';
  attributeKey?: string;
  uiPreference?: 'Standard' | 'Emphasized' | 'Hidden';
  customNote?: string;
}

interface PreferencesTableProps {
  preferences: UserPreference[];
  isLoading: boolean;
  onEdit: (preference: UserPreference | null) => void;
}

// Utility to check if a string is a color
function isColor(value: string) {
  return (
    /^#([0-9a-f]{3}){1,2}$/i.test(value) ||
    /^rgb(a)?\(/i.test(value) ||
    /^hsl(a)?\(/i.test(value)
  );
}

const PreferencesTable: React.FC<PreferencesTableProps> = ({ preferences, isLoading, onEdit }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            User Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading preferences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences || preferences.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            User Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Preferences Set</h3>
            <p className="text-muted-foreground mb-4">
              You haven't configured any personal preferences yet. Click the button below to get started.
            </p>
            <Button onClick={() => onEdit(null)}>
              <Settings className="h-4 w-4 mr-2" />
              Add First Preference
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPreferenceCategory = (key: string): string => {
    if (key.startsWith('ui.')) return 'UI Preferences';
    if (key.startsWith('data.')) return 'Data Display';
    if (key.startsWith('notification.')) return 'Notifications';
    if (key.startsWith('theme.')) return 'Theme';
    return 'General';
  };

  const getPreferenceIcon = (key: string) => {
    if (key.startsWith('ui.')) return <Settings className="h-4 w-4" />;
    if (key.startsWith('data.')) return <Palette className="h-4 w-4" />;
    if (key.startsWith('notification.')) return <Settings className="h-4 w-4" />;
    if (key.startsWith('theme.')) return <Palette className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  const formatValue = (value: string | undefined | null): string => {
    if (value === undefined || value === null) return '';
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        return JSON.stringify(parsed, null, 2);
      }
      return String(parsed);
    } catch {
      return String(value);
    }
  };

  // Group preferences by category
  const groupedPreferences = preferences.reduce((acc, preference) => {
    const category = getPreferenceCategory(preference.key);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(preference);
    return acc;
  }, {} as Record<string, UserPreference[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedPreferences).map(([category, categoryPreferences]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPreferenceIcon(categoryPreferences[0]?.key || '')}
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preference</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryPreferences.map((preference) => (
                  <TableRow key={preference.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{preference.key}</span>
                        {preference.uiPreference && (
                          <Badge variant="secondary" className="text-xs">
                            {preference.uiPreference}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isColor(preference.value) && (
                          <span
                            className="inline-block w-6 h-6 rounded border"
                            style={{ background: preference.value }}
                            title={preference.value}
                          />
                        )}
                        <span>{typeof preference.value === 'string' || typeof preference.value === 'number' ? formatValue(preference.value) : ''}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {preference.modelType || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(preference)}
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

export default PreferencesTable; 