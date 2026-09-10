'use client';

import dynamic from 'next/dynamic';

// Dynamically import the WebhookManagement component to avoid SSR issues
const WebhookManagement = dynamic(
  () => import('@/components/settings/WebhookManagement'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading webhook management...</p>
        </div>
      </div>
    )
  }
);

export default function WebhooksPage() {
  return (
    <div className="container mx-auto py-6 px-6">
      <WebhookManagement />
    </div>
  );
} 