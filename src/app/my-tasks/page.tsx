export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation';

export default async function MyTasksPageServer() {
  redirect('/applicants?view=task-board');
}

