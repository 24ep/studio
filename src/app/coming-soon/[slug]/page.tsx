import { ComingSoonPage } from '@/components/ui/ComingSoonPage';
import { redirect } from 'next/navigation';

const pageTitles: Record<string, string> = {
  appraisal: 'Appraisal',
  goal: 'Goal',
  'leave-encashment': 'Leave Encashment',
  'leave-control-panel': 'Leave Control Panel',
  'leave-policy-assignment': 'Leave Policy Assignment',
  'leave-allocation': 'Leave Allocation',
  'employee-advance': 'Employee Advance',
  'expense-claim': 'Expense Claim',
  travel: 'Travel',
  'accounting-entries': 'Accounting Entries',
  tax: 'Tax',
  'learning-path': 'Learning Path',
  'broadcast-config': 'Broadcast Config',
  'dashboard-studio': 'Dashboard Studio',
  'import-export-data': 'Import & Export Data',
  integration: 'Integration',
};

export default async function SidebarComingSoonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expenseRedirects: Record<string, string> = {
    'employee-advance': '/expenses/advances',
    'expense-claim': '/expenses/claims',
    travel: '/expenses/travel',
    'accounting-entries': '/expenses/accounting',
  };
  if (expenseRedirects[slug]) redirect(expenseRedirects[slug]);
  const title = pageTitles[slug] || slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <ComingSoonPage
      title={title}
      description={`${title} is included in the navigation and will be available in a future release.`}
    />
  );
}
