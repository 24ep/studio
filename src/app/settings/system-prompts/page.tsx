"use client";

import { SystemPromptsPageView } from './SystemPromptsPageView';
import { useSystemPromptsPage } from './use-system-prompts-page';

export default function SystemPromptsPage() {
  return <SystemPromptsPageView {...useSystemPromptsPage()} />;
}
