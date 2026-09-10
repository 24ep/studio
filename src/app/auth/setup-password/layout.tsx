import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set up password | hrive',
  description: 'Securely set the password for your employee platform account.',
};

export default function SetupPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
