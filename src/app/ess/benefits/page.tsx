import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { BenefitsPage } from '@/components/ess/BenefitsPage';

export default async function EssBenefitsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  return <BenefitsPage />;
}
