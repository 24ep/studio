import { BrainCircuit, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EvaluationAddMethodDialogProps {
  open: boolean;
  positionTitle: string;
  onOpenChange: (open: boolean) => void;
  onSelectMethod: (method: 'template' | 'custom') => void;
}

function ChevronIndicator() {
  return (
    <div className="text-muted-foreground">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

export function EvaluationAddMethodDialog({
  open,
  positionTitle,
  onOpenChange,
  onSelectMethod,
}: EvaluationAddMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dialogId="add-method-modal">
        <DialogHeader>
          <DialogTitle>Add Skills</DialogTitle>
          <DialogDescription>
            Choose how you want to add skills to "{positionTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectMethod('template')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Use Template</h3>
                  <p className="text-muted-foreground">
                    Select from predefined skill templates for common roles
                  </p>
                </div>
                <ChevronIndicator />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectMethod('custom')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <Settings className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Custom Selection</h3>
                  <p className="text-muted-foreground">
                    Manually select individual skills from all available options
                  </p>
                </div>
                <ChevronIndicator />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
