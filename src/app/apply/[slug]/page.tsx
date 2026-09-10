import type { Metadata } from 'next';
import { PublicApplyPage } from '../PublicApplyPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apply',
  description: 'Submit your resume for an open position.',
};

export default async function ApplySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicApplyPage slug={slug} />;
}
