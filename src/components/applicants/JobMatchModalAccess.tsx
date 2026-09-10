import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LockClosedIcon as Lock } from '@heroicons/react/24/outline';

interface AccessDeniedJobMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessDeniedJobMatchDialog({ isOpen, onClose }: AccessDeniedJobMatchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" />
            Access Denied
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-8 text-muted-foreground">
          <Lock className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>You don't have permission to view job matches.</p>
          <p className="text-sm mt-2">Contact your administrator to request access.</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
