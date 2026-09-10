import { redirect } from 'next/navigation';

export default function PreferencesSettingsPage() {
  redirect('/settings/system-preferences');
  return null;
}
