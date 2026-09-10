import { redirect } from 'next/navigation';

export default async function LeaveBlockListPage() {
  redirect('/workforce/holidays?tab=leave-blocks');
}
