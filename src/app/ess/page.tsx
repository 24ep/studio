import { redirect } from 'next/navigation';
import { getValidatedAuthSession } from '@/lib/validated-auth-session';

export default async function EssPage() {
  const session = await getValidatedAuthSession();
  if (!session) redirect('/auth/signin');

  redirect('/employee-portal');
}
