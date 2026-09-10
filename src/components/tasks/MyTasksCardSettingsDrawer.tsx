import { Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CardCustomizationSettings } from '@/components/tasks/CardCustomizationSettings';
import type { TaskBoardPreferences } from '@/hooks/use-user-preferences';

interface MyTasksCardSettingsDrawerProps {
  open: boolean;
  preferences: TaskBoardPreferences;
  onOpenChange: (open: boolean) => void;
  onUpdatePreferences: (updates: Partial<TaskBoardPreferences>) => void;
  onResetPreferences: () => void;
}

export function MyTasksCardSettingsDrawer({
  open,
  preferences,
  onOpenChange,
  onUpdatePreferences,
  onResetPreferences,
}: MyTasksCardSettingsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]" sheetId="my-tasks-card-settings-drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Card Customization Settings
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <CardCustomizationSettings
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
            onResetPreferences={onResetPreferences}
            isSaving={false}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
