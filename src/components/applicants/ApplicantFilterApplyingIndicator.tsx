"use client";

export function ApplicantFilterApplyingIndicator() {
  return (
    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
      <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      Applying filters...
    </div>
  );
}
