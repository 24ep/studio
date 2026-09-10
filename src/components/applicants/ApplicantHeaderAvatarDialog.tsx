import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Applicant } from "@/lib/types";

interface ApplicantAvatarDialogProps {
  applicant: Applicant;
  avatarImageUrl: string | null;
  contentZIndex: number;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function ApplicantAvatarDialog({
  applicant,
  avatarImageUrl,
  contentZIndex,
  onOpenChange,
  open,
}: ApplicantAvatarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-full w-full h-full max-h-screen p-0 m-0 rounded-none flex flex-col items-center justify-center bg-black/95 fixed inset-0 translate-x-0 translate-y-0"
        dialogId="avatar-fullscreen-modal"
        style={{ zIndex: contentZIndex + 100 }}
      >
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {avatarImageUrl ? (
            <img
              src={avatarImageUrl}
              alt={applicant.name || "Avatar"}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-700 dark:text-blue-300 font-bold text-4xl flex items-center justify-center">
              {getApplicantInitials(applicant.name)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getApplicantInitials(name?: string | null) {
  return name
    ? name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "C";
}
