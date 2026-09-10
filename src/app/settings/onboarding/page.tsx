import { redirect } from 'next/navigation';

import { OnboardingChecklistAdminClient } from './OnboardingChecklistAdminClient';

export default async function OnboardingChecklistSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ adminCenterEmbed?: string }>;
}) {
  const { adminCenterEmbed } = await searchParams;

  if (adminCenterEmbed !== '1') {
    redirect('/settings?adminTab=hr-setup&config=onboarding');
  }

  return <OnboardingChecklistAdminClient embedded />;
}
