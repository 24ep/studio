import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Settings } from 'lucide-react';
import type { SystemSetting } from "@/lib/types";

import { renderSystemSettingValue } from './system-settings-table-utils';

interface SystemSettingsStateCardProps {
  message: string;
}

interface SystemSettingsCategoryCardProps {
  category: string;
  settings: SystemSetting[];
  onEdit: (setting: SystemSetting) => void;
}

interface SystemSettingTableRowProps {
  setting: SystemSetting;
  onEdit: (setting: SystemSetting) => void;
}

export function SystemSettingsStateCard({ message }: SystemSettingsStateCardProps) {
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
          <div className="text-muted-foreground">{message}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemSettingsCategoryCard({
  category,
  settings,
  onEdit,
}: SystemSettingsCategoryCardProps) {
  return (
    <Card className="group relative overflow-hidden border-2 border-blue-200 dark:border-blue-800 hover:border-opacity-80 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl bg-blue-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
            <Settings className="h-5 w-5 text-white" />
          </span>
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
            {settings.map((setting) => (
              <SystemSettingTableRow
                key={setting.key}
                setting={setting}
                onEdit={onEdit}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SystemSettingTableRow({
  setting,
  onEdit,
}: SystemSettingTableRowProps) {
  const displayValue = renderSystemSettingValue(setting.value);

  return (
    <TableRow>
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
        <div className="max-w-md truncate" title={displayValue}>
          {displayValue}
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
  );
}
