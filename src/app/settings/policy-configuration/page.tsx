import { redirect } from 'next/navigation';

import { PolicyConfigurationClient } from './PolicyConfigurationClient';
import { getPolicyConfigurationArea } from './policy-configuration-model';

export default async function PolicyConfigurationPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const { area } = await searchParams;
  if (area === 'billing') redirect('/settings/billing');
  return <PolicyConfigurationClient area={getPolicyConfigurationArea(area ?? null)} />;
}
