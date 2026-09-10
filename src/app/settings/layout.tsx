import type { Metadata } from 'next';
import { SettingsClientLayout } from './SettingsClientLayout';

export const metadata: Metadata = {
  title: 'Admin Center | hrive',
  description: 'Manage system configuration, roles, permissions, and platform settings.',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsClientLayout>{children}</SettingsClientLayout>;
}
