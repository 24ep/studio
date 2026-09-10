import { AuditControlsWorkspace } from '@/components/audit-controls/AuditControlsWorkspace';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Audit & Controls | hrive' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ adminCenterEmbed?: string }>;
}) {
  const { adminCenterEmbed } = await searchParams;

  if (adminCenterEmbed !== '1') {
    redirect('/settings?adminTab=logs-monitoring&config=audit-controls');
  }

  return <AuditControlsWorkspace />;
}
