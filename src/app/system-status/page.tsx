"use client";

import { SystemStatusPageView } from './SystemStatusPageView';
import { useSystemStatusPage } from './use-system-status-page';

export default function SystemStatusPage() {
  const page = useSystemStatusPage();
  return <SystemStatusPageView page={page} />;
}
