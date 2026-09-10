import {
  SidebarColorThemeTabs,
  type SidebarColorThemeTabsProps,
} from "./SidebarColorThemeControls";
import { SystemPreferenceRow, SystemPreferenceSection } from "./SystemPreferenceRows";

export function SidebarColorThemeSection(props: SidebarColorThemeTabsProps) {
  return (
    <SystemPreferenceSection
      title="Sidebar Colors"
      description="Choose background and font colors independently for light and dark mode."
    >
      <SystemPreferenceRow
        label="Background & font colors"
        description="Adjust the sidebar surface, font, hover, active, icon, and border colors."
      >
        <SidebarColorThemeTabs {...props} />
      </SystemPreferenceRow>
    </SystemPreferenceSection>
  );
}
