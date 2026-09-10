import { redirect } from 'next/navigation';

export default function MeetingRoomsRedirectPage() {
  redirect('/settings/rooms');
}
