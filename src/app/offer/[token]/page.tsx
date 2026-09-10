import { OfferLetterPageClient } from './OfferLetterPageClient';

interface OfferLetterPageProps {
  params: Promise<{ token: string }>;
}

export default async function OfferLetterPage({ params }: OfferLetterPageProps) {
  const { token } = await params;
  return <OfferLetterPageClient token={token} />;
}
