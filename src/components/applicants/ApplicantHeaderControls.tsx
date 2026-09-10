import { XMarkIcon as X } from "@heroicons/react/24/outline";

interface ApplicantHeaderModalControlsProps {
  contentZIndex: number;
  onClose?: () => void;
}

export function ApplicantHeaderModalControls({
  contentZIndex,
  onClose,
}: ApplicantHeaderModalControlsProps) {
  if (!onClose) return null;

  return (
    <div
      className="absolute -top-1 right-0 flex items-center gap-1"
      style={{ zIndex: contentZIndex + 1 }}
    >
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-md border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 pointer-events-auto"
        title="Close"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onClose();
        }}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
