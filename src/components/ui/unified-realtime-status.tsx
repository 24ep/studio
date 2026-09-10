import { UnifiedRealtimeStatusCard } from './unified-realtime-status-card';
import { UnifiedRealtimeStatusCompact } from './unified-realtime-status-compact';
import type { UnifiedRealtimeStatusProps } from './unified-realtime-status-types';

export function UnifiedRealtimeStatus({
  showDetails = false,
  compact = false,
  ...props
}: UnifiedRealtimeStatusProps) {
  if (compact) {
    return <UnifiedRealtimeStatusCompact {...props} showDetails={showDetails} compact={compact} />;
  }

  return <UnifiedRealtimeStatusCard {...props} showDetails={showDetails} compact={compact} />;
}
