import { ServiceDeskPage } from '@/components/privacy-support/ServiceDeskPage';

export const metadata = { title: 'Service Desk | hrive' };

export default async function Page({ searchParams }: { searchParams: Promise<{ ticket?: string }> }) {
  const params = await searchParams;
  const ticketId = params.ticket && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(params.ticket) ? params.ticket : null;
  return <ServiceDeskPage initialTicketId={ticketId} />;
}
