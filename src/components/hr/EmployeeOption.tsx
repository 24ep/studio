import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function EmployeeOption({ name, avatarUrl, detail, className }: {
  name: string;
  avatarUrl?: string | null;
  detail?: string;
  className?: string;
}) {
  const initials = name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <Avatar className="h-7 w-7 rounded-full border">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="rounded-full" /> : null}
        <AvatarFallback className="rounded-full text-[10px] font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <span className="block truncate text-sm font-medium">{name}</span>
        {detail ? <span className="block truncate text-xs text-muted-foreground">{detail}</span> : null}
      </div>
    </div>
  );
}
