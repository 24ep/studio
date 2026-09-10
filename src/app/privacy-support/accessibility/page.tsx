import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/settings/user-preferences?tab=accessibility');
}
