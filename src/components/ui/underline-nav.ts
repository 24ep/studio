export const UNDERLINE_NAV_CONTAINER_CLASS =
  "flex w-full border-b border-border/50";

export const UNDERLINE_NAV_TRIGGER_BASE_CLASS =
  "relative flex items-center gap-2 rounded-none border-0 bg-transparent text-sm font-medium transition-colors duration-200 cursor-pointer " +
  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-center after:rounded-none after:transition-transform after:duration-200 after:content-['']";

export function getUnderlineNavTriggerClassName(
  active: boolean,
  className?: string,
) {
  return [
    UNDERLINE_NAV_TRIGGER_BASE_CLASS,
    active
      ? "text-primary after:scale-x-100 after:bg-primary"
      : "text-muted-foreground after:scale-x-0 hover:text-foreground hover:after:scale-x-100 hover:after:bg-border",
    className,
  ].filter(Boolean).join(" ");
}
