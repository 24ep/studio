import { hasPermission, isAdminUser } from '@/lib/permissions';
import { getValidatedAuthSession } from '@/lib/validated-auth-session';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const session = await getValidatedAuthSession();

  if (!session) {
    redirect('/auth/signin');
  }

  const isAdminLike = isAdminUser(session?.user) || hasPermission(session?.user, 'SYSTEM_SETTINGS_VIEW');

  if (isAdminLike) {
    redirect('/dashboard');
  }

  redirect('/employee-portal');
}
