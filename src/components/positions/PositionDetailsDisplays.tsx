import { Badge } from '@/components/ui/badge';
import { getPositionStatusBadge } from '@/lib/positionUtils';
import { cn } from '@/lib/utils';
import type { Position } from '@/lib/types';

export function PositionGradeDisplay({ position }: { position: Position }) {
  if (!position.gradeId || !position.grade) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30 bg-muted/10">
        No Grade
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="text-xs font-bold"
        style={{
          borderColor: position.grade.color || '#3B82F6',
          color: position.grade.color || '#3B82F6',
          backgroundColor: `${position.grade.color}10`,
        }}
      >
        {position.grade.name}
      </Badge>
      {position.grade.label && (
        <span className="text-sm text-muted-foreground italic">
          ({position.grade.label})
        </span>
      )}
    </div>
  );
}

export function PositionStatusDisplay({ position }: { position: Position }) {
  const statusBadge = getPositionStatusBadge(position.isOpen, false);

  return (
    <div className="flex items-center">
      <Badge
        variant={statusBadge.variant}
        className={cn(statusBadge.className, 'font-bold')}
      >
        {statusBadge.text}
      </Badge>
    </div>
  );
}

export function UnassignedRecruiterBadge() {
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30 bg-muted/10">
      Unassigned
    </Badge>
  );
}
