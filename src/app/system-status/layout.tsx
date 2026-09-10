import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Status | hrive',
  description: 'Inspect infrastructure dependencies, storage, authentication, and environment readiness.',
};

export default function SystemStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
