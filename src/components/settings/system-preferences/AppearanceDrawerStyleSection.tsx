import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DrawerStyle } from './constants';
import { DRAWER_STYLE_OPTIONS } from './appearance-tab-utils';
import { SystemPreferenceRow, SystemPreferenceSection } from './SystemPreferenceRows';

interface AppearanceDrawerStyleSectionProps {
  canEdit: boolean;
  drawerStyle: DrawerStyle;
  setDrawerStyle: (value: DrawerStyle) => void;
}

export function AppearanceDrawerStyleSection({
  canEdit,
  drawerStyle,
  setDrawerStyle,
}: AppearanceDrawerStyleSectionProps) {
  return (
    <SystemPreferenceSection
      title="Drawer Style"
      description="Choose how drawers appear throughout the application."
    >
      <SystemPreferenceRow
        htmlFor="drawer-style"
        label="Drawer Style"
        description={drawerStyle === 'classic'
          ? 'Drawers slide in from the side and take full height.'
          : 'Drawers appear as modal-like panels on the right side with margins and rounded corners.'}
      >
        <Select
          value={drawerStyle}
          onValueChange={(value) => setDrawerStyle(value as DrawerStyle)}
          disabled={!canEdit}
        >
          <SelectTrigger id="drawer-style" className="w-full">
            <SelectValue placeholder="Select drawer style" />
          </SelectTrigger>
          <SelectContent>
            {DRAWER_STYLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SystemPreferenceRow>
    </SystemPreferenceSection>
  );
}
