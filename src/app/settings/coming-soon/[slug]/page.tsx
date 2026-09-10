import { ComingSoonPage } from '@/components/ui/ComingSoonPage';

const titles: Record<string, string> = {
  branches: 'Branch',
  'holiday-list': 'Holiday List',
  'leave-block-list': 'Leave Block List',
  'default-user-role': 'Default User Role',
  'employee-portal': 'Employee Portal',
  'self-service-access': 'Self Service Access',
  'notification-settings': 'Notification Settings',
  'single-sign-on': 'Single Sign-On',
  'domain-verification': 'Domain Verification',
  'system-monitoring': 'System Monitoring',
  billing: 'Billing',
};

export default async function SettingsComingSoonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = titles[slug] || slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <ComingSoonPage
      title={title}
      description={`${title} settings are being prepared and will be available soon.`}
    />
  );
}
