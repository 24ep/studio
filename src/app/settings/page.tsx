"use client";

import './settings.css';

import { SettingsPageErrorBoundary } from './SettingsPageErrorBoundary';
import { SettingsPageView } from './SettingsPageView';
import { useSettingsPage } from './use-settings-page';

function SettingsPageContent() {
  const page = useSettingsPage();

  return (
    <SettingsPageView
      accessibleItems={page.accessibleItems}
      isLoading={page.isLoading}
    />
  );
}

export default function SettingsPage() {
  return (
    <SettingsPageErrorBoundary>
      <SettingsPageContent />
    </SettingsPageErrorBoundary>
  );
}
