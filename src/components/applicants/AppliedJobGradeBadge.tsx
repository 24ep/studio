import { Badge } from "@/components/ui/badge";
import type { getAppliedJobGradeBadgeData } from "./full-applicant-detail-utils";

type AppliedJobGradeBadgeData = NonNullable<ReturnType<typeof getAppliedJobGradeBadgeData>>;

interface AppliedJobGradeBadgeProps {
  gradeBadgeData: AppliedJobGradeBadgeData | null;
}

export function AppliedJobGradeBadge({ gradeBadgeData }: AppliedJobGradeBadgeProps) {
  if (!gradeBadgeData) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="text-xs"
        style={{
          borderColor: gradeBadgeData.color,
          color: gradeBadgeData.color,
        }}
      >
        {gradeBadgeData.name}
      </Badge>
    </div>
  );
}
