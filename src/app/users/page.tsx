// Redirect /users to /settings/users
import { redirect } from 'next/navigation';

export default function UsersRedirectPage() {
  redirect('/settings/users');
}
