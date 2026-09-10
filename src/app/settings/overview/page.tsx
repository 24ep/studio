"use client";

import '../settings.css';

import { AdminCenterOverview } from '../AdminCenterOverview';
import { SettingsPageErrorBoundary } from '../SettingsPageErrorBoundary';
import { useSettingsPage } from '../use-settings-page';

function AdminCenterOverviewContent() {
  const page = useSettingsPage();
  return <AdminCenterOverview accessibleItems={page.accessibleItems} isLoading={page.isLoading} />;
}

export default function AdminCenterOverviewPage() {
  return (
    <SettingsPageErrorBoundary>
      <AdminCenterOverviewContent />
    </SettingsPageErrorBoundary>
  );
}
