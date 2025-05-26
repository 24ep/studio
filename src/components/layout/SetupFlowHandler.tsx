
// src/components/layout/SetupFlowHandler.tsx
// This component is no longer needed as the setup page is being removed.
// Keeping a minimal component to prevent build errors if still referenced unexpectedly,
// but its usage will be removed from AppLayout.
import type { ReactNode } from 'react';

export function SetupFlowHandler({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
